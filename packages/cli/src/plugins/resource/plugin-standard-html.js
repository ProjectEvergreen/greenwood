/* eslint-disable complexity, max-depth */
/*
 *
 * Manages web standard resource related operations for HTML and markdown.
 * This is a Greenwood default plugin.
 *
 */
import frontmatter from 'front-matter';
import fs from 'fs/promises';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { ResourceInterface } from '../../lib/resource-interface.js';
import { getUserScripts, getPageTemplate, getAppTemplate } from '../../lib/templating-utils.js';
import { requestAsObject } from '../../lib/resource-utils.js';
import unified from 'unified';
import { Worker } from 'worker_threads';

class StandardHtmlResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ['.html', '.md'];
    this.contentType = 'text/html';
  }

  async shouldServe(url) {
    const { basePath } = this.compilation.config;
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find(node => `${basePath}${node.route}` === pathname);
    const isSPA = this.compilation.graph.find(node => node.isSPA) && pathname.indexOf('.') < 0;

    return protocol.startsWith('http') && (hasMatchingPageRoute || isSPA);
  }

  async serve(url, request) {
    const { config, context } = this.compilation;
    const { pagesDir, userWorkspace } = context;
    const { interpolateFrontmatter, basePath } = config;
    const { pathname } = url;
    const isSpaRoute = this.compilation.graph.find(node => node.isSPA);
    const matchingRoute = this.compilation.graph.find((node) => `${basePath}${node.route}` === pathname) || {};
    console.log({ matchingRoute });
    const filePath = !matchingRoute.external ? matchingRoute.path : '';
    const isMarkdownContent = (matchingRoute?.filename || '').split('.').pop() === 'md';

    let customImports = [];
    let body = '';
    let title = null;
    let template = null;
    let frontMatter = {};
    let ssrBody;
    let ssrTemplate;
    let ssrFrontmatter;
    let processedMarkdown = null;

    if (matchingRoute.external) {
      template = matchingRoute.template || template;
    }

    if (isMarkdownContent) {
      const markdownContents = await fs.readFile(filePath, 'utf-8');
      const rehypePlugins = [];
      const remarkPlugins = [];

      for (const plugin of config.markdown.plugins) {
        if (plugin.indexOf('rehype-') >= 0) {
          rehypePlugins.push((await import(plugin)).default);
        }

        if (plugin.indexOf('remark-') >= 0) {
          remarkPlugins.push((await import(plugin)).default);
        }
      }

      const settings = config.markdown.settings || {};
      const fm = frontmatter(markdownContents);

      processedMarkdown = await unified()
        .use(remarkParse, settings) // parse markdown into AST
        .use(remarkFrontmatter) // extract frontmatter from AST
        .use(remarkPlugins) // apply userland remark plugins
        .use(remarkRehype, { allowDangerousHtml: true }) // convert from markdown to HTML AST
        .use(rehypeRaw) // support mixed HTML in markdown
        .use(rehypePlugins) // apply userland rehype plugins
        .use(rehypeStringify) // convert AST to HTML string
        .process(markdownContents);

      // configure via frontmatter
      if (fm.attributes) {
        frontMatter = fm.attributes;

        if (frontMatter.title) {
          title = frontMatter.title;
        }

        if (frontMatter.template) {
          template = frontMatter.template;
        }

        if (frontMatter.imports) {
          customImports = frontMatter.imports;
        }
      }
    }

    if (matchingRoute.isSSR) {
      const routeModuleLocationUrl = new URL(`./${matchingRoute.filename}`, pagesDir);
      const routeWorkerUrl = this.compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider().executeModuleUrl;

      await new Promise(async (resolve, reject) => {
        const worker = new Worker(new URL('../../lib/ssr-route-worker.js', import.meta.url));

        worker.on('message', (result) => {
          if (result.template) {
            ssrTemplate = result.template;
          }
          if (result.body) {
            ssrBody = result.body;
          }
          if (result.frontmatter) {
            ssrFrontmatter = result.frontmatter;

            if (ssrFrontmatter.title) {
              title = ssrFrontmatter.title;
              frontMatter.title = ssrFrontmatter.title;
            }

            if (ssrFrontmatter.template) {
              template = ssrFrontmatter.template;
            }

            if (ssrFrontmatter.imports) {
              customImports = customImports.concat(ssrFrontmatter.imports);
            }
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
          moduleUrl: routeModuleLocationUrl.href,
          compilation: JSON.stringify(this.compilation),
          page: JSON.stringify(matchingRoute),
          request: await requestAsObject(request)
        });
      });
    }

    // get context plugins
    const contextPlugins = this.compilation.config.plugins.filter((plugin) => {
      return plugin.type === 'context';
    }).map((plugin) => {
      return plugin.provider(this.compilation);
    });

    if (isSpaRoute) {
      body = await fs.readFile(new URL(`./${isSpaRoute.filename}`, userWorkspace), 'utf-8');
    } else {
      body = ssrTemplate ? ssrTemplate : await getPageTemplate(filePath, context, template, contextPlugins);
    }

    body = await getAppTemplate(body, context, customImports, contextPlugins, config.devServer.hud, title, basePath);
    body = await getUserScripts(body, context);

    if (processedMarkdown) {
      const wrappedCustomElementRegex = /<p><[a-zA-Z]*-[a-zA-Z](.*)>(.*)<\/[a-zA-Z]*-[a-zA-Z](.*)><\/p>/g;
      const ceTest = wrappedCustomElementRegex.test(processedMarkdown.contents);

      if (ceTest) {
        const ceMatches = processedMarkdown.contents.match(wrappedCustomElementRegex);

        ceMatches.forEach((match) => {
          const stripWrappingTags = match
            .replace('<p>', '')
            .replace('</p>', '');

          processedMarkdown.contents = processedMarkdown.contents.replace(match, stripWrappingTags);
        });
      }

      // https://github.com/ProjectEvergreen/greenwood/issues/1126
      body = body.replace(/\<content-outlet>(.*)<\/content-outlet>/s, processedMarkdown.contents.replace(/\$/g, '$$$'));
    } else if (matchingRoute.external) {
      body = body.replace(/\<content-outlet>(.*)<\/content-outlet>/s, matchingRoute.body);
    } else if (ssrBody) {
      body = body.replace(/\<content-outlet>(.*)<\/content-outlet>/s, ssrBody);
    }

    if (interpolateFrontmatter) {
      for (const fm in frontMatter) {
        const interpolatedFrontmatter = '\\$\\{globalThis.page.' + fm + '\\}';

        body = body.replace(new RegExp(interpolatedFrontmatter, 'g'), frontMatter[fm]);
      }
    }

    // give the user something to see so they know it works, if they have no content
    if (body.indexOf('<content-outlet></content-outlet>') > 0) {
      body = body.replace('<content-outlet></content-outlet>', `
        <h1>Welcome to Greenwood!</h1>
      `);
    }

    return new Response(body, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }

  async shouldOptimize(url, response) {
    return response.headers.get('Content-Type').indexOf(this.contentType) >= 0;
  }

  async optimize(url, response) {
    const { optimization } = this.compilation.config;
    const { pathname } = url;
    const pageResources = this.compilation.graph.find(page => page.outputPath === pathname || page.route === pathname).resources;
    let body = await response.text();

    for (const pageResource of pageResources) {
      const keyedResource = this.compilation.resources.get(pageResource);
      const { contents, src, type, optimizationAttr, optimizedFileContents, optimizedFileName, rawAttributes } = keyedResource;

      if (src) {
        if (type === 'script') {
          if (!optimizationAttr && optimization === 'default') {
            const optimizedFilePath = `/${optimizedFileName}`;

            body = body.replace(src, optimizedFilePath);
            body = body.replace('<head>', `
              <head>
              <link rel="modulepreload" href="${optimizedFilePath}" as="script">
            `);
          } else if (optimizationAttr === 'inline' || optimization === 'inline') {
            const isModule = rawAttributes.indexOf('type="module') >= 0 ? ' type="module"' : '';

            body = body.replace(`<script ${rawAttributes}></script>`, `
              <script ${isModule}>
                ${optimizedFileContents.replace(/\.\//g, '/').replace(/\$/g, '$$$')}
              </script>
            `);
          } else if (optimizationAttr === 'static' || optimization === 'static') {
            body = body.replace(`<script ${rawAttributes}></script>`, '');
          }
        } else if (type === 'link') {
          if (!optimizationAttr && (optimization !== 'none' && optimization !== 'inline')) {
            const optimizedFilePath = `/${optimizedFileName}`;

            body = body.replace(src, optimizedFilePath);
            body = body.replace('<head>', `
              <head>
              <link rel="preload" href="${optimizedFilePath}" as="style" crossorigin="anonymous"></link>
            `);
          } else if (optimizationAttr === 'inline' || optimization === 'inline') {
            // https://github.com/ProjectEvergreen/greenwood/issues/810
            // when pre-rendering, puppeteer normalizes everything to <link .../>
            // but if not using pre-rendering, then it could come out as <link ...></link>
            // not great, but best we can do for now until #742
            body = body.replace(`<link ${rawAttributes}>`, `
              <style>
                ${optimizedFileContents}
              </style>
            `).replace(`<link ${rawAttributes}/>`, `
              <style>
                ${optimizedFileContents}
              </style>
            `);
          }
        }
      } else {
        if (type === 'script') {
          if (optimizationAttr === 'static' || optimization === 'static') {
            body = body.replace(`<script ${rawAttributes}>${contents.replace(/\.\//g, '/').replace(/\$/g, '$$$')}</script>`, '');
          } else if (optimizationAttr === 'none') {
            body = body.replace(contents, contents.replace(/\.\//g, '/').replace(/\$/g, '$$$'));
          } else {
            body = body.replace(contents, optimizedFileContents.replace(/\.\//g, '/').replace(/\$/g, '$$$'));
          }
        } else if (type === 'style') {
          body = body.replace(contents, optimizedFileContents);
        }
      }
    }

    // TODO clean up lit-polyfill
    // https://github.com/ProjectEvergreen/greenwood/issues/728
    body = body.replace(/<script src="(.*lit\/polyfill-support.js)"><\/script>/, '');

    return new Response(body);
  }
}

const greenwoodPluginStandardHtml = {
  type: 'resource',
  name: 'plugin-standard-html',
  provider: (compilation, options) => new StandardHtmlResource(compilation, options)
};

export { greenwoodPluginStandardHtml };