/* eslint-disable complexity, max-depth */
import fs from 'fs/promises';
import fm from 'front-matter';
import { checkResourceExists, requestAsObject } from '../lib/resource-utils.js';
import toc from 'markdown-toc';
import { Worker } from 'worker_threads';

function labelFromRoute(_route) {
  let route = _route;

  if (route === '/index/') {
    return 'Home';
  } else if (route.endsWith('/index/')) {
    route = route.replace('index/', '');
  }

  return route
    .split('/')
    .filter(part => part !== '')
    .pop()
    .split('-')
    .map((routePart) => {
      return `${routePart.charAt(0).toUpperCase()}${routePart.substring(1)}`;
    })
    .join(' ');
}
const generateGraph = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { context, config } = compilation;
      const { basePath } = config;
      const { pagesDir, projectDirectory, userWorkspace } = context;
      const collections = {};
      const customPageFormatPlugins = config.plugins
        .filter(plugin => plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin)
        .map(plugin => plugin.provider(compilation));

      let apis = new Map();
      let graph = [{
        outputPath: '/index.html',
        filename: 'index.html',
        path: '/',
        route: `${basePath}/`,
        id: 'index',
        label: 'Index',
        data: {},
        imports: [],
        resources: [],
        prerender: true,
        isolation: false
      }];

      const walkDirectoryForPages = async function(directory, pages = [], apiRoutes = new Map()) {
        const files = await fs.readdir(directory);

        for (const filename of files) {
          const filenameUrl = new URL(`./${filename}`, directory);
          const filenameUrlAsDir = new URL(`./${filename}/`, directory);
          const isDirectory = await checkResourceExists(filenameUrlAsDir) && (await fs.stat(filenameUrlAsDir)).isDirectory();

          if (isDirectory) {
            const nextPages = await walkDirectoryForPages(filenameUrlAsDir, pages, apiRoutes);

            pages = nextPages.pages;
            apiRoutes = nextPages.apiRoutes;
          } else {
            const extension = `.${filenameUrl.pathname.split('.').pop()}`;
            const relativePagePath = filenameUrl.pathname.replace(pagesDir.pathname, '/');
            const relativeWorkspacePath = directory.pathname.replace(projectDirectory.pathname, '');
            const isApiRoute = relativePagePath.startsWith('/api');
            const req = isApiRoute
              ? new Request(filenameUrl)
              : new Request(filenameUrl, { headers: { 'Accept': 'text/html' } });
            let isCustom = null;

            for (const plugin of customPageFormatPlugins) {
              if (plugin.shouldServe && await plugin.shouldServe(filenameUrl, req)) {
                isCustom = plugin.servePage;
                break;
              }
            }

            const isStatic = isCustom === 'static' || extension === '.md' || extension === '.html';
            const isDynamic = isCustom === 'dynamic' || extension === '.js';
            const isPage = isStatic || isDynamic;

            if (isApiRoute) {
              const extension = filenameUrl.pathname.split('.').pop();

              if (extension !== 'js' && !isCustom) {
                console.warn(`${filenameUrl} is not a supported API file extension, skipping...`);
                return;
              }

              const relativeApiPath = filenameUrl.pathname.replace(pagesDir.pathname, '/');
              const route = `${basePath}${relativeApiPath.replace(`.${extension}`, '')}`;
              // TODO should this be run in isolation like SSR pages?
              // https://github.com/ProjectEvergreen/greenwood/issues/991
              const { isolation } = await import(filenameUrl).then(module => module);

              /*
              * API Properties (per route)
              *----------------------
              * filename: base filename of the page
              * outputPath: the filename to write to when generating a build
              * path: path to the file relative to the workspace
              * route: URL route for a given page on outputFilePath
              * isolation: if this should be run in isolated mode
              */
              apiRoutes.set(route, {
                filename: filename,
                outputPath: relativeApiPath,
                path: relativeApiPath,
                route,
                isolation
              });
            } else if (isPage) {
              let route = relativePagePath.replace(extension, '');
              let root = filename.split('/')[filename.split('/').length - 1].replace(extension, '');
              let layout = extension === '.html' ? null : 'page';
              let label = labelFromRoute(`${route}/`);
              let title = null; // TODO use label here
              let imports = [];
              let customData = {};
              let filePath;
              let prerender = true;
              let isolation = false;
              let hydration = false;

              /*
              * check if additional nested directories exist to correctly determine route (minus filename)
              * examples:
              * - pages/index.{html,md,js} -> /
              * - pages/about.{html,md,js} -> /about/
              * - pages/blog/index.{html,md,js} -> /blog/
              * - pages/blog/some-post.{html,md,js} -> /blog/some-post/
              */
              if (relativePagePath.lastIndexOf('/') > 0) {
                // https://github.com/ProjectEvergreen/greenwood/issues/455
                route = root === 'index' || route.replace('/index', '') === `/${root}`
                  ? route.replace('index', '')
                  : `${route}/`;
              } else {
                route = route === '/index'
                  ? '/'
                  : `${route}/`;
              }

              if (isStatic) {
                const fileContents = await fs.readFile(filenameUrl, 'utf8');
                const { attributes } = fm(fileContents);

                layout = attributes.layout || layout;
                title = attributes.title || title;
                label = attributes.label || label;
                imports = attributes.imports || [];
                filePath = `${relativeWorkspacePath}${filename}`;

                // prune "reserved" attributes that are supported by Greenwood
                // https://www.greenwoodjs.io/docs/front-matter
                customData = attributes;

                delete customData.label;
                delete customData.imports;
                delete customData.title;
                delete customData.layout;

                /* Menu Query
                * Custom front matter - Variable Definitions
                * --------------------------------------------------
                * menu: the name of the menu in which this item can be listed and queried
                * index: the index of this list item within a menu
                * linkheadings: flag to tell us where to add page's table of contents as menu items
                * tableOfContents: json object containing page's table of contents(list of headings)
                */
                // set specific menu to place this page
                customData.menu = customData.menu || '';

                // set specific index list priority of this item within a menu
                customData.index = customData.index || '';

                // set flag whether to gather a list of headings on a page as menu items
                customData.linkheadings = customData.linkheadings || 0;
                customData.tableOfContents = [];

                if (customData.linkheadings > 0) {
                  // parse markdown for table of contents and output to json
                  customData.tableOfContents = toc(fileContents).json;
                  customData.tableOfContents.shift();

                  // parse table of contents for only the pages user wants linked
                  if (customData.tableOfContents.length > 0 && customData.linkheadings > 0) {
                    customData.tableOfContents = customData.tableOfContents
                      .filter((item) => item.lvl === customData.linkheadings);
                  }
                }
                /* ---------End Menu Query-------------------- */
              } else if (isDynamic) {
                const routeWorkerUrl = compilation.config.plugins.filter(plugin => plugin.type === 'renderer')[0].provider(compilation).executeModuleUrl;
                let ssrFrontmatter;

                filePath = route;

                await new Promise(async (resolve, reject) => {
                  const worker = new Worker(new URL('../lib/ssr-route-worker.js', import.meta.url));
                  const request = await requestAsObject(new Request(filenameUrl));

                  worker.on('message', async (result) => {
                    prerender = result.prerender ?? false;
                    isolation = result.isolation ?? isolation;
                    hydration = result.hydration ?? hydration;

                    if (result.frontmatter) {
                      result.frontmatter.imports = result.frontmatter.imports || [];
                      ssrFrontmatter = result.frontmatter;
                    }

                    resolve();
                  });
                  worker.on('error', reject);
                  worker.on('exit', (code) => {
                    if (code !== 0) {
                      reject(new Error(`Worker stopped with exit code ${code}`));
                    }
                  });

                  worker.postMessage({
                    executeModuleUrl: routeWorkerUrl.href,
                    moduleUrl: filenameUrl.href,
                    compilation: JSON.stringify(compilation),
                    // TODO need to get as many of these params as possible
                    // or ignore completely?
                    page: JSON.stringify({
                      servePage: isCustom,
                      route,
                      root,
                      label
                    }),
                    request
                  });
                });

                if (ssrFrontmatter) {
                  layout = ssrFrontmatter.layout || layout;
                  title = ssrFrontmatter.title || title;
                  imports = ssrFrontmatter.imports || imports;
                  customData = ssrFrontmatter.data || customData;
                  label = ssrFrontmatter.label || label;

                  /* Menu Query
                  * Custom front matter - Variable Definitions
                  * --------------------------------------------------
                  * menu: the name of the menu in which this item can be listed and queried
                  * index: the index of this list item within a menu
                  * linkheadings: flag to tell us where to add page's table of contents as menu items
                  * tableOfContents: json object containing page's table of contents(list of headings)
                  */
                  customData.menu = ssrFrontmatter.menu || '';
                  customData.index = ssrFrontmatter.index || '';
                }
              }

              /*
              * Graph Properties (per page)
              *----------------------
              * data: custom page frontmatter
              * filename: base filename of the page
              * relativeWorkspacePagePath: the file path relative to the user's workspace directory
              * label: "pretty" text representation of the filename
              * imports: per page JS or CSS file imports to be included in HTML output from frontmatter
              * resources: sum of all resources for the entire page
              * outputPath: the filename to write to when generating static HTML
              * path: path to the file relative to the workspace
              * route: URL route for a given page on outputFilePath
              * layout: page layout to use as a base for a generated component
              * title: a default value that can be used for <title></title>
              * isSSR: if this is a server side route
              * prerender: if this should be statically exported
              * isolation: if this should be run in isolated mode
              * hydration: if this page needs hydration support
              * servePage: signal that this is a custom page file type (static | dynamic)
              */
              const page = {
                data: customData || {},
                filename,
                relativeWorkspacePagePath: relativePagePath,
                label,
                imports,
                resources: [],
                outputPath: route === '/404/'
                  ? '/404.html'
                  : `${route}index.html`,
                path: filePath,
                route: `${basePath}${route}`,
                layout,
                title,
                isSSR: !isStatic,
                prerender,
                isolation,
                hydration,
                servePage: isCustom
              };

              pages.push(page);

              const pageCollection = customData.collection;

              if (pageCollection) {
                if (!collections[pageCollection]) {
                  collections[pageCollection] = [];
                }

                collections[pageCollection].push(page);
              }

              compilation.collections = collections;
            } else {
              console.debug(`Unhandled extension (${extension}) for route => ${route}`);
            }
          }
        }

        return { pages, apiRoutes };
      };

      console.debug('building from local sources...');

      // test for SPA
      if (await checkResourceExists(new URL('./index.html', userWorkspace))) {
        graph = [{
          ...graph[0],
          path: `${userWorkspace.pathname}index.html`,
          isSPA: true
        }];
      } else {
        const oldGraph = graph[0];
        const pages = await checkResourceExists(pagesDir) ? await walkDirectoryForPages(pagesDir) : { pages: graph, apiRoutes: apis };

        graph = pages.pages;
        apis = pages.apiRoutes;

        const has404Page = graph.find(page => page.route.endsWith('/404/'));

        // if the _only_ page is a 404 page, still provide a default index.html
        if (has404Page && graph.length === 1) {
          graph = [
            oldGraph,
            ...graph
          ];
        } else if (!has404Page) {
          graph = [
            ...graph,
            {
              ...oldGraph,
              outputPath: '/404.html',
              filename: '404.html',
              route: `${basePath}/404/`,
              path: '404.html',
              id: '404',
              label: 'Not Found'
            }
          ];
        }
      }

      const sourcePlugins = compilation.config.plugins.filter(plugin => plugin.type === 'source');

      if (sourcePlugins.length > 0) {
        console.debug('building from external sources...');
        for (const plugin of sourcePlugins) {
          const instance = plugin.provider(compilation);
          const data = await instance();

          for (const node of data) {
            if (!node.body || !node.route) {
              const missingKey = !node.body ? 'body' : 'route';

              reject(`ERROR: provided node does not provide a ${missingKey} property.`);
            }

            graph.push({
              filename: null,
              path: null,
              data: {},
              imports: [],
              resources: [],
              outputPath: `${node.route}index.html`,
              ...node,
              external: true
            });
          }
        }
      }

      compilation.graph = graph;
      compilation.manifest = { apis };

      resolve(compilation);
    } catch (err) {
      reject(err);
    }

  });
};

export { generateGraph };