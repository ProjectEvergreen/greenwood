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

// general refactoring
const getPageTemplate = (barePath, workspace, template) => {
  const templatesDir = path.join(workspace, 'templates');
  const pageIsHtmlPath = `${barePath.substring(0, barePath.lastIndexOf('/index'))}.html`;

  if (template && fs.existsSync(`${templatesDir}/${template}.html`)) {
    // use a predefined template, usually from markdown frontmatter
    contents = fs.readFileSync(`${templatesDir}/${template}.html`, 'utf-8');
  } else if (fs.existsSync(`${barePath}.html`) || fs.existsSync(pageIsHtmlPath)) {
    // if the page is already HTML, use that as the template
    const indexPath = fs.existsSync(pageIsHtmlPath)
      ? pageIsHtmlPath
      : `${barePath}.html`;
    
    contents = fs.readFileSync(indexPath, 'utf-8');
  } else if (fs.existsSync(`${templatesDir}/page.html`)) {
    // else look for default page template
    contents = fs.readFileSync(`${templatesDir}/page.html`, 'utf-8');
  } else if (fs.existsSync(`${templatesDir}/app.html`)) {
    // fallback to just using their app template
    contents = fs.readFileSync(`${templatesDir}/app.html`, 'utf-8');
  } else {
    // fallback to using Greenwood's stock page template
    contents = fs.readFileSync(path.join(__dirname, '../../templates/page.html'), 'utf-8');
  }

  return contents;
};

const getAppTemplate = (contents, userWorkspace) => {
  function sliceTemplate(template, pos, needle, replacer) {
    return template.slice(0, pos) + template.slice(pos).replace(needle, replacer);
  }
  
  const userAppTemplatePath = `${userWorkspace}/templates/app.html`;
  let appTemplateContents = fs.existsSync(userAppTemplatePath)
    ? fs.readFileSync(userAppTemplatePath, 'utf-8')
    : fs.readFileSync(path.join(__dirname, '../../templates/app.html'), 'utf-8');

  const root = htmlparser.parse(contents, {
    script: true,
    style: true,
    noscript: true,
    pre: true
  });
  const body = root.querySelector('body').innerHTML;
  const headScripts = root.querySelectorAll('head script');
  const headLinks = root.querySelectorAll('head link');
  const headStyles = root.querySelectorAll('head style');

  appTemplateContents = appTemplateContents.replace(/<page-outlet><\/page-outlet>/, body);
  
  headScripts.forEach((script) => {
    const matchNeedle = '</script>';
    const matchPos = appTemplateContents.lastIndexOf(matchNeedle);

    if (script.text === '') {
      if (matchPos > 0) {
        appTemplateContents = sliceTemplate(appTemplateContents, matchPos, matchNeedle, `</script>\n
          <script ${script.rawAttrs}></script>\n
        `);
      } else {
        appTemplateContents = appTemplateContents.replace('</head>', `
            <script ${script.rawAttrs}></script>\n
          </head>
        `);
      }
    }

    if (script.text !== '') {
      const attributes = script.rawAttrs !== '' 
        ? ` ${script.rawAttrs}`
        : '';
      if (matchPos > 0) {
        appTemplateContents = sliceTemplate(appTemplateContents, matchPos, matchNeedle, `</script>\n
          <script${attributes}>
            ${script.text}
          </script>\n
        `);
      } else {
        appTemplateContents = appTemplateContents.replace('</head>', `
            <script${attributes}>
              ${script.text}
            </script>\n
          </head>
        `);
      }
    }
  });

  headLinks.forEach((link) => {
    const matchNeedle = /<link .*/g;
    const matches = appTemplateContents.match(matchNeedle);
    const lastLink = matches && matches.length && matches.length > 0 
      ? matches[matches.length - 1]
      : '<head>';

    appTemplateContents = appTemplateContents.replace(lastLink, `${lastLink}\n
      <link ${link.rawAttrs}/>
    `);
  });

  headStyles.forEach((style) => {
    const matchNeedle = '</style>';
    const matchPos = appTemplateContents.lastIndexOf(matchNeedle);

    if (style.rawAttrs === '') {
      if (matchPos > 0) {
        appTemplateContents = sliceTemplate(appTemplateContents, matchPos, matchNeedle, `</style>\n
          <style>
            ${style.text}
          </style>\n
        `);
      } else {
        appTemplateContents = appTemplateContents.replace('<head>', `
          <head> \n
            <style>
              ${style.text}
            </style>\n
        `);
      }
    }
  });
  
  return appTemplateContents;
};

const getUserScripts = (contents) => {
  if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
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

        // give the user something to see so they know it works, if they have no content
        if (body.indexOf('<content-outlet></content-outlet>') > 0) {
          body = body.replace('<content-outlet></content-outlet>', `
            <h1>Welcome to Greenwood!</h1>
          `);
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

  async shouldOptimize(url) {
    return Promise.resolve(path.extname(url) === '.html');
  }

  async optimize(url, body) {
    return new Promise((resolve, reject) => {
      try {
        body = body.replace(/<script src="\/node_modules\/@webcomponents\/webcomponentsjs\/webcomponents-bundle.js"><\/script>/, '');
        body = body.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
        body = body.replace(/<script defer="" src="\/node_modules\/es-module-shims\/dist\/es-module-shims.js"><\/script>/, '');
        body = body.replace(/<script type="module-shim"/g, '<script type="module"');
    
        resolve(body);
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