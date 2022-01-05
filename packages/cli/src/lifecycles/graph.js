/* eslint-disable complexity */
import fs from 'fs';
import fm from 'front-matter';
import path from 'path';
import toc from 'markdown-toc';

const generateGraph = async (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { context, config } = compilation;
      const { pagesDir, routesDir, userWorkspace } = context;
      let graph = [{
        outputPath: 'index.html',
        filename: 'index.html',
        path: '/',
        route: '/',
        id: 'index',
        label: 'Index',
        data: {},
        imports: []
      }];

      const walkDirectoryForRoutes = async function(directory, routes = []) {
        await Promise.all((await fs.promises.readdir(directory)).map(async (filename) => {
          const fullPath = path.normalize(`${directory}${path.sep}${filename}`);

          if (fs.statSync(fullPath).isDirectory()) {
            routes = await walkDirectoryForRoutes(fullPath, routes);
          } else {
            const { getFrontmatter } = await import(fullPath);
            const relativePagePath = fullPath.substring(routesDir.length - 1, fullPath.length);
            const id = filename.split(path.sep)[filename.split(path.sep).length - 1].replace('.js', '');
            const label = id.split('-')
              .map((idPart) => {
                return `${idPart.charAt(0).toUpperCase()}${idPart.substring(1)}`;
              }).join(' ');
            const route = relativePagePath
              .replace('.js', '')
              .replace(/\\/g, '/')
              .concat('/');
            let template = 'page';
            let title = `${compilation.config.title} - ${label}`;
            let customData = {};
            let imports = [];

            if (getFrontmatter) {
              const ssrFmData = await getFrontmatter(compilation, route, label, id);

              template = ssrFmData.template ? ssrFmData.template : template;
              title = ssrFmData.title ? ssrFmData.title : title;
              imports = ssrFmData.imports ? ssrFmData.imports : imports;

              /* Menu Query
               * Custom front matter - Variable Definitions
               * --------------------------------------------------
               * menu: the name of the menu in which this item can be listed and queried
               * index: the index of this list item within a menu
               * linkheadings: flag to tell us where to add page's table of contents as menu items
               * tableOfContents: json object containing page's table of contents(list of headings)
               */
              customData.menu = ssrFmData.menu || '';
              customData.index = ssrFmData.index || '';

              // TODO?
              // set flag whether to gather a list of headings on a page as menu items
              // customData.linkheadings = ssrFmData.linkheadings || 0;
              // customData.tableOfContents = [];
  
              // if (customData.linkheadings > 0) {
              //   // parse markdown for table of contents and output to json
              //   customData.tableOfContents = toc(fileContents).json;
              //   customData.tableOfContents.shift();
  
              //   // parse table of contents for only the pages user wants linked
              //   if (customData.tableOfContents.length > 0 && customData.linkheadings > 0) {
              //     customData.tableOfContents = customData.tableOfContents
              //       .filter((item) => item.lvl === customData.linkheadings);
              //   }
              // }
            }

            /*
             * Graph Properties (per page)
             *----------------------
             * data: custom page frontmatter
             * filename: base filename of the page
             * id: filename without the extension
             * label: "pretty" text representation of the filename
             * imports: per page JS or CSS file imports to be included in HTML output
             * outputPath: the filename to write to when generating static HTML
             * path: path to the file relative to the workspace
             * route: URL route for a given page on outputFilePath
             * template: page template to use as a base for a generated component
             * title: a default value that can be used for <title></title>
             */
            routes.push({
              data: customData,
              filename,
              id,
              label,
              imports,
              outputPath: route === '/404/'
                ? '404.html'
                : `${route}index.html`,
              path: route,
              route,
              template,
              title,
              isSSR: true
            });
          }
        }));

        return routes;
      };

      const walkDirectoryForPages = function(directory, pages = []) {
        
        fs.readdirSync(directory).forEach((filename) => {
          const fullPath = path.normalize(`${directory}${path.sep}${filename}`);
          
          if (fs.statSync(fullPath).isDirectory()) {
            pages = walkDirectoryForPages(fullPath, pages);
          } else {
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { attributes } = fm(fileContents);
            const relativePagePath = fullPath.substring(pagesDir.length - 1, fullPath.length);
            const relativeWorkspacePath = directory.replace(process.cwd(), '').replace(path.sep, '');
            const template = attributes.template || 'page';
            const title = attributes.title || compilation.config.title || '';
            const id = attributes.label || filename.split(path.sep)[filename.split(path.sep).length - 1].replace('.md', '').replace('.html', '');
            const imports = attributes.imports || [];
            const label = id.split('-')
              .map((idPart) => {
                return `${idPart.charAt(0).toUpperCase()}${idPart.substring(1)}`;
              }).join(' ');
            let route = relativePagePath
              .replace('.md', '')
              .replace('.html', '')
              .replace(/\\/g, '/');

            /*
             * check if additional nested directories exist to correctly determine route (minus filename)
             * examples:
             * - pages/index.{html,md} -> /
             * - pages/about.{html,md} -> /about/
             * - pages/blog/index.{html,md} -> /blog/
             * - pages/blog/some-post.{html,md} -> /blog/some-post/
             */
            if (relativePagePath.lastIndexOf(path.sep) > 0) {
              // https://github.com/ProjectEvergreen/greenwood/issues/455
              route = id === 'index' || route.replace('/index', '') === `/${id}`
                ? route.replace('index', '')
                : `${route}/`;
            } else {
              route = route === '/index'
                ? '/'
                : `${route}/`;
            }
            
            // prune "reserved" attributes that are supported by Greenwood
            // https://www.greenwoodjs.io/docs/front-matter
            const customData = attributes;

            delete customData.label;
            delete customData.imports;
            delete customData.title;
            delete customData.template;

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

            /*
             * Graph Properties (per page)
             *----------------------
             * data: custom page frontmatter
             * filename: base filename of the page
             * id: filename without the extension
             * label: "pretty" text representation of the filename
             * imports: per page JS or CSS file imports to be included in HTML output
             * outputPath: the filename to write to when generating static HTML
             * path: path to the file relative to the workspace
             * route: URL route for a given page on outputFilePath
             * template: page template to use as a base for a generated component
             * title: a default value that can be used for <title></title>
             */
            pages.push({
              data: customData || {},
              filename,
              id,
              label,
              imports,
              outputPath: route === '/404/'
                ? '404.html'
                : `${route}index.html`,
              path: route === '/' || relativePagePath.lastIndexOf(path.sep) === 0
                ? `${relativeWorkspacePath}${filename}`
                : `${relativeWorkspacePath}${path.sep}${filename}`,
              route,
              template,
              title
            });
          }
        });

        return pages;
      };

      console.debug('building from local sources...');
      if (config.mode === 'spa') {
        graph = [{
          ...graph[0],
          path: `${userWorkspace}${path.sep}index.html`
        }];
      } else {
        const oldGraph = graph[0];
        const pages = fs.existsSync(pagesDir) ? walkDirectoryForPages(pagesDir) : graph;
        const routes = fs.existsSync(routesDir) ? await walkDirectoryForRoutes(routesDir) : [];

        graph = [...pages, ...routes];

        const has404Page = graph.filter(page => page.route === '/404/').length === 1;

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
              outputPath: '404.html',
              filename: '404.html',
              route: '/404/',
              path: '404.html',
              title: 'Not Found',
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
              outputPath: path.join(node.route, 'index.html'),
              ...node,
              external: true
            });
          }
        }
      }

      compilation.graph = graph;

      if (!fs.existsSync(context.scratchDir)) {
        await fs.promises.mkdir(context.scratchDir);
      }

      await fs.promises.writeFile(`${context.scratchDir}/graph.json`, JSON.stringify(compilation.graph));

      resolve(compilation);
    } catch (err) {
      reject(err);
    }

  });
};

export { generateGraph };