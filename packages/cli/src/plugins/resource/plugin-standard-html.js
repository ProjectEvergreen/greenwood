/* eslint-disable complexity, max-depth */
/*
 *
 * Manages web standard resource related operations for HTML and markdown.
 * This is a Greenwood default plugin.
 *
 */
import frontmatter from 'front-matter';
import fs from 'fs';
import htmlparser from 'node-html-parser';
import path from 'path';
import rehypeStringify from 'rehype-stringify';
import rehypeRaw from 'rehype-raw';
import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { ResourceInterface } from '../../lib/resource-interface.js';
import unified from 'unified';
import { Worker } from 'worker_threads';

function getCustomPageTemplates(contextPlugins, templateName) {
  return contextPlugins
    .map(plugin => plugin.templates)
    .flat()
    .filter((templateDirUrl) => {
      return templateName && fs.existsSync(new URL(`./${templateName}.html`, templateDirUrl).pathname);
    });
}

// TODO use URL more here
const getPageTemplate = async (filePath, templatesDir, template, contextPlugins = [], pagesDir) => {
  const customPluginDefaultPageTemplates = getCustomPageTemplates(contextPlugins, 'page');
  const customPluginPageTemplates = getCustomPageTemplates(contextPlugins, template);
  const extension = filePath.split('.').pop();
  const is404Page = path.basename(filePath).indexOf('404') === 0 && extension === 'html';
  let contents;

  if (template && customPluginPageTemplates.length > 0 || fs.existsSync(new URL(`./${template}.html`, templatesDir).pathname)) {
    // use a custom template, usually from markdown frontmatter
    contents = customPluginPageTemplates.length > 0
      ? await fs.promises.readFile(`${customPluginPageTemplates[0].pathname}${template}.html`, 'utf-8')
      : await fs.promises.readFile(new URL(`./${template}.html`, templatesDir), 'utf-8');
  } else if (extension === 'html' && fs.existsSync(filePath)) {
    // if the page is already HTML, use that as the template, NOT accounting for 404 pages
    contents = await fs.promises.readFile(filePath, 'utf-8');
  } else if (customPluginDefaultPageTemplates.length > 0 || (!is404Page && fs.existsSync(new URL('./page.html', templatesDir).pathname))) {
    // else look for default page template from the user
    // and 404 pages should be their own "top level" template
    contents = customPluginDefaultPageTemplates.length > 0
      ? await fs.promises.readFile(`${customPluginDefaultPageTemplates[0].pathname}page.html`, 'utf-8')
      : await fs.promises.readFile(new URL('./page.html', templatesDir), 'utf-8');
  } else if (is404Page && !fs.existsSync(new URL('./404.html', pagesDir).pathname)) {
    contents = await fs.promises.readFile(new URL('../../templates/404.html', import.meta.url).pathname, 'utf-8');
  } else {
    // fallback to using Greenwood's stock page template
    contents = await fs.promises.readFile(new URL('../../templates/page.html', import.meta.url).pathname, 'utf-8');
  }

  return contents;
};

const getAppTemplate = async (pageTemplateContents, templatesDir, customImports = [], contextPlugins, enableHud, frontmatterTitle) => {
  const userAppTemplatePath = new URL('./app.html', templatesDir);
  const customAppTemplates = getCustomPageTemplates(contextPlugins, 'app');
  let mergedTemplateContents = '';
  let appTemplateContents = customAppTemplates.length > 0
    ? await fs.promises.readFile(`${customAppTemplates[0].pathname}app.html`)
    : fs.existsSync(userAppTemplatePath.pathname)
      ? await fs.promises.readFile(userAppTemplatePath, 'utf-8')
      : await fs.promises.readFile(new URL('../../templates/app.html', import.meta.url), 'utf-8');

  const pageRoot = htmlparser.parse(pageTemplateContents, {
    script: true,
    style: true,
    noscript: true,
    pre: true
  });
  const appRoot = htmlparser.parse(appTemplateContents, {
    script: true,
    style: true
  });

  if (!pageRoot.valid || !appRoot.valid) {
    console.debug('ERROR: Invalid HTML detected');
    const invalidContents = !pageRoot.valid
      ? pageTemplateContents
      : appTemplateContents;

    if (enableHud) {
      appTemplateContents = appTemplateContents.replace('<body>', `
        <body>
          <div style="position: absolute; width: auto; border: dotted 3px red; background-color: white; opacity: 0.75; padding: 1% 1% 0">
            <p>Malformed HTML detected, please check your closing tags or an <a href="https://www.google.com/search?q=html+formatter" target="_blank" rel="noreferrer">HTML formatter</a>.</p>
            <details>
              <pre>
                ${invalidContents.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}
              </pre>
            </details>
          </div>
      `);
    }

    mergedTemplateContents = appTemplateContents.replace(/<page-outlet><\/page-outlet>/, '');
  } else {
    const appTitle = appRoot ? appRoot.querySelector('head title') : null;
    const appBody = appRoot.querySelector('body') ? appRoot.querySelector('body').innerHTML : '';
    const pageBody = pageRoot.querySelector('body') ? pageRoot.querySelector('body').innerHTML : '';
    const pageTitle = pageRoot.querySelector('head title');
    const hasInterpolatedFrontmatter = pageTitle && pageTitle.rawText.indexOf('${globalThis.page.title}') >= 0
     || appTitle && appTitle.rawText.indexOf('${globalThis.page.title}') >= 0;

    const title = hasInterpolatedFrontmatter // favor frontmatter interpolation first
      ? pageTitle && pageTitle.rawText
        ? pageTitle.rawText
        : appTitle.rawText
      : frontmatterTitle // otherwise, work in order of specificity from page -> page template -> app template
        ? frontmatterTitle
        : pageTitle && pageTitle.rawText
          ? pageTitle.rawText
          : appTitle && appTitle.rawText
            ? appTitle.rawText
            : 'My App';

    const mergedHtml = pageRoot.querySelector('html').rawAttrs !== ''
      ? `<html ${pageRoot.querySelector('html').rawAttrs}>`
      : appRoot.querySelector('html').rawAttrs !== ''
        ? `<html ${appRoot.querySelector('html').rawAttrs}>`
        : '<html>';

    const mergedMeta = [
      ...appRoot.querySelectorAll('head meta'),
      ...pageRoot.querySelectorAll('head meta')
    ].join('\n');

    const mergedLinks = [
      ...appRoot.querySelectorAll('head link'),
      ...pageRoot.querySelectorAll('head link')
    ].join('\n');

    const mergedStyles = [
      ...appRoot.querySelectorAll('head style'),
      ...pageRoot.querySelectorAll('head style'),
      ...customImports.filter(resource => path.extname(resource) === '.css')
        .map(resource => `<link rel="stylesheet" href="${resource}"></link>`)
    ].join('\n');

    const mergedScripts = [
      ...appRoot.querySelectorAll('head script'),
      ...pageRoot.querySelectorAll('head script'),
      ...customImports.filter(resource => path.extname(resource) === '.js')
        .map(resource => `<script src="${resource}" type="module"></script>`)
    ].join('\n');

    mergedTemplateContents = `<!DOCTYPE html>
      ${mergedHtml}
        <head>
          <title>${title}</title>
          ${mergedMeta}
          ${mergedLinks}
          ${mergedStyles}
          ${mergedScripts}
        </head>
        <body>
          ${appBody.replace(/<page-outlet><\/page-outlet>/, pageBody)}
        </body>
      </html>
    `;
  }

  return mergedTemplateContents;
};

const getUserScripts = async (contents, context) => {
  // https://lit.dev/docs/tools/requirements/#polyfills
  if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
    const { projectDirectory, userWorkspace } = context;
    const dependencies = fs.existsSync(new URL('./package.json', userWorkspace).pathname) // handle monorepos first
      ? JSON.parse(await fs.promises.readFile(new URL('./package.json', userWorkspace), 'utf-8')).dependencies
      : fs.existsSync(new URL('./package.json', projectDirectory).pathname)
        ? JSON.parse(await fs.promises.readFile(new URL('./package.json', projectDirectory), 'utf-8')).dependencies
        : {};

    const litPolyfill = dependencies && dependencies.lit
      ? '<script src="/node_modules/lit/polyfill-support.js"></script>\n'
      : '';

    contents = contents.replace('<head>', `
      <head>
        ${litPolyfill}
    `);
  }
  return contents;
};

class StandardHtmlResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);

    this.extensions = ['.html', '.md'];
    this.contentType = 'text/html';
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;
    const hasMatchingPageRoute = this.compilation.graph.find(node => node.route === pathname);

    return protocol.startsWith('http') && (hasMatchingPageRoute || this.compilation.graph[0].isSPA);
  }

  async serve(url) {
    const { config } = this.compilation;
    const { pagesDir, userTemplatesDir } = this.compilation.context;
    const { interpolateFrontmatter } = config;
    const { pathname } = url;
    const isSpaRoute = this.compilation.graph[0].isSPA;
    const matchingRoute = this.compilation.graph.find((node) => node.route === pathname) || {};
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
      const markdownContents = await fs.promises.readFile(filePath, 'utf-8');
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
      const routeWorkerUrl = this.compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider().workerUrl;

      await new Promise((resolve, reject) => {
        const worker = new Worker(routeWorkerUrl);

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
          modulePath: routeModuleLocationUrl.pathname,
          compilation: JSON.stringify(this.compilation),
          route: matchingRoute.path
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
      body = fs.readFileSync(this.compilation.graph[0].path, 'utf-8');
    } else {
      body = ssrTemplate ? ssrTemplate : await getPageTemplate(filePath, userTemplatesDir, template, contextPlugins, pagesDir);
    }

    body = await getAppTemplate(body, userTemplatesDir, customImports, contextPlugins, config.devServer.hud, title);
    body = await getUserScripts(body, this.compilation.context);

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

      body = body.replace(/\<content-outlet>(.*)<\/content-outlet>/s, processedMarkdown.contents);
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

    // TODO avoid having to rebuild response each time?
    return new Response(body, {
      headers: {
        'content-type': this.contentType
      }
    });
  }

  async shouldOptimize(url, response) {
    return response.headers.get('content-type').indexOf(this.contentType) >= 0;
  }

  async optimize(url, response) {
    const { optimization } = this.compilation.config;
    const { pathname } = url;
    const pageResources = this.compilation.graph.find(page => page.outputPath === pathname || page.route === pathname).imports;
    let body = await response.text();

    for (const pageResource of pageResources) {
      const keyedResource = this.compilation.resources.get(pageResource.sourcePathURL.pathname);
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

    // TODO clean up lit-polyfill as part of https://github.com/ProjectEvergreen/greenwood/issues/728
    body = body.replace(/<script src="(.*lit\/polyfill-support.js)"><\/script>/, '');

    return new Response(body, {
      headers: response.headers
    });
  }
}

const greenwoodPluginStandardHtml = {
  type: 'resource',
  name: 'plugin-standard-html',
  provider: (compilation, options) => new StandardHtmlResource(compilation, options)
};

export { greenwoodPluginStandardHtml };