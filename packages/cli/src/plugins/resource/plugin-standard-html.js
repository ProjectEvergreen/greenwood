/* eslint-disable complexity, max-depth */
/*
 *
 * Manages web standard resource related operations for HTML and markdown.
 * This is a Greenwood default plugin.
 *
 */
import { checkResourceExists } from '../../lib/resource-utils.js';
import frontmatter from 'front-matter';
import fs from 'fs/promises';
import { getPackageJson } from '../../lib/node-modules-utils.js';
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

async function getCustomPageTemplatesFromPlugins(contextPlugins, templateName) {
  const customTemplateLocations = [];
  const templateDir = contextPlugins
    .map(plugin => plugin.templates)
    .flat();

  for (const templateDirUrl of templateDir) {
    if (templateName) {
      const templateUrl = new URL(`./${templateName}.html`, templateDirUrl);

      if (await checkResourceExists(templateUrl)) {
        customTemplateLocations.push(templateUrl);
      }
    }
  }

  return customTemplateLocations;
}

const getPageTemplate = async (filePath, { userTemplatesDir, pagesDir, projectDirectory }, template, contextPlugins = []) => {
  const customPluginDefaultPageTemplates = await getCustomPageTemplatesFromPlugins(contextPlugins, 'page');
  const customPluginPageTemplates = await getCustomPageTemplatesFromPlugins(contextPlugins, template);
  const extension = filePath.split('.').pop();
  const is404Page = filePath.startsWith('404') && extension === 'html';
  const hasCustomTemplate = await checkResourceExists(new URL(`./${template}.html`, userTemplatesDir));
  const hasPageTemplate = await checkResourceExists(new URL('./page.html', userTemplatesDir));
  const hasCustom404Page = await checkResourceExists(new URL('./404.html', pagesDir));
  const isHtmlPage = extension === 'html' && await checkResourceExists(new URL(`./${filePath}`, projectDirectory));
  let contents;

  if (template && (customPluginPageTemplates.length > 0 || hasCustomTemplate)) {
    // use a custom template, usually from markdown frontmatter
    contents = customPluginPageTemplates.length > 0
      ? await fs.readFile(new URL(`./${template}.html`, customPluginPageTemplates[0]), 'utf-8')
      : await fs.readFile(new URL(`./${template}.html`, userTemplatesDir), 'utf-8');
  } else if (isHtmlPage) {
    // if the page is already HTML, use that as the template, NOT accounting for 404 pages
    contents = await fs.readFile(new URL(`./${filePath}`, projectDirectory), 'utf-8');
  } else if (customPluginDefaultPageTemplates.length > 0 || (!is404Page && hasPageTemplate)) {
    // else look for default page template from the user
    // and 404 pages should be their own "top level" template
    contents = customPluginDefaultPageTemplates.length > 0
      ? await fs.readFile(new URL('./page.html', customPluginDefaultPageTemplates[0]), 'utf-8')
      : await fs.readFile(new URL('./page.html', userTemplatesDir), 'utf-8');
  } else if (is404Page && !hasCustom404Page) {
    contents = await fs.readFile(new URL('../../templates/404.html', import.meta.url), 'utf-8');
  } else {
    // fallback to using Greenwood's stock page template
    contents = await fs.readFile(new URL('../../templates/page.html', import.meta.url), 'utf-8');
  }

  return contents;
};

const getAppTemplate = async (pageTemplateContents, templatesDir, customImports = [], contextPlugins, enableHud, frontmatterTitle) => {
  const userAppTemplateUrl = new URL('./app.html', templatesDir);
  const customAppTemplatesFromPlugins = await getCustomPageTemplatesFromPlugins(contextPlugins, 'app');
  const hasCustomUserAppTemplate = await checkResourceExists(userAppTemplateUrl);
  let appTemplateContents = customAppTemplatesFromPlugins.length > 0
    ? await fs.readFile(new URL('./app.html', customAppTemplatesFromPlugins[0]))
    : hasCustomUserAppTemplate
      ? await fs.readFile(userAppTemplateUrl, 'utf-8')
      : await fs.readFile(new URL('../../templates/app.html', import.meta.url), 'utf-8');
  let mergedTemplateContents = '';

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
    const userPackageJson = await getPackageJson(context);
    const dependencies = userPackageJson?.dependencies || {};
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
    const isSPA = this.compilation.graph.find(node => node.isSPA) && pathname.indexOf('.') < 0;

    return protocol.startsWith('http') && (hasMatchingPageRoute || isSPA);
  }

  async serve(url) {
    const { config } = this.compilation;
    const { pagesDir, userTemplatesDir, userWorkspace } = this.compilation.context;
    const { interpolateFrontmatter } = config;
    const { pathname } = url;
    const isSpaRoute = this.compilation.graph.find(node => node.isSPA);
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
          moduleUrl: routeModuleLocationUrl.href,
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
      body = await fs.readFile(new URL(`./${isSpaRoute.filename}`, userWorkspace), 'utf-8');
    } else {
      body = ssrTemplate ? ssrTemplate : await getPageTemplate(filePath, this.compilation.context, template, contextPlugins);
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