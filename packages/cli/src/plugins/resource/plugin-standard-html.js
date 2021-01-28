/*
 * 
 * Manages web standard resource related operations for HTML and markdown.
 * This is a Greenwood default plugin.
 *
 */
const frontmatter = require('front-matter');
const fs = require('fs');
const htmlparser = require('node-html-parser');
const path = require('path');
const rehypeStringify = require('rehype-stringify');
const rehypeRaw = require('rehype-raw');
const remarkFrontmatter = require('remark-frontmatter');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const { ResourceInterface } = require('../../lib/resource-interface');
const unified = require('unified');

// TODO better error handling / messaging for users if things are not where they are expected to be
// general refactoring
const getPageTemplate = (barePath, workspace, template) => {
  const templatesDir = path.join(workspace, 'templates');

  if (template && fs.existsSync(`${templatesDir}/${template}.html`)) {
    // use a predefined template, usually from markdown frontmatter
    contents = fs.readFileSync(`${templatesDir}/${template}.html`, 'utf-8');
  } else if (fs.existsSync(`${barePath}.html`)) {
    // if the page is already HTML, use that as the template
    contents = fs.readFileSync(`${barePath}.html`, 'utf-8');
  } else if (fs.existsSync(`${templatesDir}/page.html`)) {
    // else look for default page template
    contents = fs.readFileSync(`${templatesDir}/page.html`, 'utf-8');
  } else if (fs.existsSync(`${templatesDir}/app.html`)) {
    // fallback to just using their app template
    contents = fs.readFileSync(`${templatesDir}/app.html`, 'utf-8');
  } else {
    // fallback to using Greenwood's stock app template
    contents = fs.readFileSync(path.join(__dirname, '../../templates/app.html'), 'utf-8');
  }

  return contents;
};

const getAppTemplate = (contents, userWorkspace) => {

  const appTemplate = `${userWorkspace}/templates/app.html`;
  let appTemplateContents = '';

  if (fs.existsSync(appTemplate)) {
    appTemplateContents = fs.readFileSync(appTemplate, 'utf-8');
    const root = htmlparser.parse(contents, {
      script: true,
      style: true,
      noscript: true,
      pre: true
    });
    const body = root.querySelector('body').innerHTML;
    const headScripts = root.querySelectorAll('head script');
    const headLinks = root.querySelectorAll('head link');

    appTemplateContents = appTemplateContents.replace(/<page-outlet><\/page-outlet>/, body);
    headScripts.forEach(script => {
      if (script.rawAttrs !== '') {
        appTemplateContents = appTemplateContents.replace(/<\/script>/, `
          </script>\n
          <script ${script.rawAttrs}></script>\n
        `);
      }

      if (script.rawAttrs === '') {
        appTemplateContents = appTemplateContents.replace(/<\/script>/, `
          </script>\n
          <script>
            ${script.text}
          </script>\n
        `);
      }
    });

    headLinks.forEach(link => {
      appTemplateContents = appTemplateContents.replace(/<\/link>/, `
        </link>\n
        <link ${link.rawAttrs}></link>\n
      `);
    });
  }

  return appTemplateContents || contents;
};

const getUserScripts = (contents) => {
  // TODO use an HTML parser?  https://www.npmjs.com/package/node-html-parser
  if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
    // TODO setup and teardown should be done together
    // console.debug('running in develop mode, attach live reload script');
    contents = contents.replace('</head>', `
        <script src="http://localhost:35729/livereload.js?snipver=1"></script>
      </head>
    `);
  }

  if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
    // TODO setup and teardown should be done together
    // console.debug('running in build mode, polyfill WebComponents for puppeteer');
    contents = contents.replace('<head>', `
      <head>
        <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
    `);
  }
  return contents;
};

const getMetaContent = (url, config, contents) => {
  const title = config.title || '';
  const metaContent = config.meta.map(item => {
    let metaHtml = '';

    // TODO better way to implememnt this?  should we implement this?
    for (const [key, value] of Object.entries(item)) {
      const isOgUrl = item.property === 'og:url' && key === 'content';
      const hasTrailingSlash = isOgUrl && value[value.length - 1] === '/';
      const contextualValue = isOgUrl
        ? hasTrailingSlash
          ? `${value}${url.replace('/', '')}`
          : `${value}${url === '/' ? '' : url}`
        : value;
        
      metaHtml += ` ${key}="${contextualValue}"`;
    }

    return item.rel
      ? `<link${metaHtml}/>`
      : `<meta${metaHtml}/>`;
  }).join('\n');

  // TODO make smarter so that if it already exists, then leave it alone
  contents = contents.replace(/<title>(.*)<\/title>/, '');
  contents = contents.replace('<head>', `<head><title>${title}</title>`);
  contents = contents.replace('<meta-outlet></meta-outlet>', metaContent);

  return contents;
};

class StandardHtmlResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    
    this.extensions = ['.html', '.md'];
    this.contentType = 'text/html';
  }

  getRelativeUserworkspaceUrl(url) {
    return url.replace(this.compilation.context.userWorkspace, '');
  }

  async shouldServe(url) {
    const { userWorkspace } = this.compilation.context;
    const relativeUrl = this.getRelativeUserworkspaceUrl(url);
    const barePath = relativeUrl.endsWith('/')
      ? `${userWorkspace}/pages${relativeUrl}index`
      : `${userWorkspace}/pages${relativeUrl.replace('.html', '')}`;
      
    return Promise.resolve((this.extensions.indexOf(path.extname(relativeUrl)) >= 0 || path.extname(relativeUrl) === '') && 
      (fs.existsSync(`${barePath}.html`) || barePath.substring(barePath.length - 5, barePath.length) === 'index')
      || fs.existsSync(`${barePath}.md`) || fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf('/index'))}.md`));
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const config = Object.assign({}, this.compilation.config);
        const { userWorkspace } = this.compilation.context;
        const normalizedUrl = this.getRelativeUserworkspaceUrl(url);
        let body = '';
        let template = null;
        let processedMarkdown = null;
        const barePath = normalizedUrl.endsWith('/')
          ? `${userWorkspace}/pages${normalizedUrl}index`
          : `${userWorkspace}/pages${normalizedUrl.replace('.html', '')}`;
        const isMarkdownContent = fs.existsSync(`${barePath}.md`)
          || fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf('/index'))}.md`)
          || fs.existsSync(`${barePath.replace('/index', '.md')}`);

        if (isMarkdownContent) {
          const markdownPath = fs.existsSync(`${barePath}.md`)
            ? `${barePath}.md`
            : fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf('/index'))}.md`)
              ? `${barePath.substring(0, barePath.lastIndexOf('/index'))}.md`
              : `${userWorkspace}/pages${url.replace('/index.html', '.md')}`;
          const markdownContents = await fs.promises.readFile(markdownPath, 'utf-8');
          const rehypePlugins = [];
          const remarkPlugins = [];

          config.markdown.plugins.forEach(plugin => {
            if (plugin.indexOf('rehype-') >= 0) {
              rehypePlugins.push(require(plugin));
            }

            if (plugin.indexOf('remark-') >= 0) {
              remarkPlugins.push(require(plugin));
            }
          });

          // TODO extract front matter contents from remark-frontmatter instead of frontmatter lib
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
            const { attributes } = fm;

            if (attributes.title) {
              config.title = `${config.title} - ${attributes.title}`;
            }
  
            if (attributes.template) {
              template = attributes.template;
            }
          }
        }
        
        body = getPageTemplate(barePath, userWorkspace, template);
        body = getAppTemplate(body, userWorkspace);
        body = getUserScripts(body);
        body = getMetaContent(normalizedUrl, config, body);

        if (processedMarkdown) {
          body = body.replace(/\<content-outlet>(.*)<\/content-outlet>/s, processedMarkdown.contents);
        }

        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  shouldOptimize() {
    return true;
  }

  async optimize(html) {
    return new Promise((resolve, reject) => {
      try {
        html = html.replace(/<script src="\/node_modules\/@webcomponents\/webcomponentsjs\/webcomponents-bundle.js"><\/script>/, '');
        html = html.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
        html = html.replace(/<script defer="" src="\/node_modules\/es-module-shims\/dist\/es-module-shims.js"><\/script>/, '');
        html = html.replace(/<script type="module-shim"/g, '<script type="module"');
    
        resolve(html);
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-standard-html',
  provider: (compilation, options) => new StandardHtmlResource(compilation, options)
};