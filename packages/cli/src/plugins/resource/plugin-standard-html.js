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

function getCustomPageTemplates(contextPlugins, templateName) {
  return contextPlugins
    .map(plugin => plugin.templates)
    .flat()
    .filter((templateDir) => {
      return templateName && fs.existsSync(path.join(templateDir, `${templateName}.html`));
    });
}

const getPageTemplate = (barePath, templatesDir, template, contextPlugins = []) => {
  const pageIsHtmlPath = `${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.html`;
  const customPluginDefaultPageTemplates = getCustomPageTemplates(contextPlugins, 'page');
  const customPluginPageTemplates = getCustomPageTemplates(contextPlugins, template);

  if (template && customPluginPageTemplates.length > 0 || fs.existsSync(`${templatesDir}/${template}.html`)) {
    // use a custom template, usually from markdown frontmatter
    contents = customPluginPageTemplates.length > 0
      ? fs.readFileSync(`${customPluginPageTemplates[0]}/${template}.html`, 'utf-8')
      : fs.readFileSync(`${templatesDir}/${template}.html`, 'utf-8');
  } else if (fs.existsSync(`${barePath}.html`) || fs.existsSync(pageIsHtmlPath)) {
    // if the page is already HTML, use that as the template
    const indexPath = fs.existsSync(pageIsHtmlPath)
      ? pageIsHtmlPath
      : `${barePath}.html`;
    
    contents = fs.readFileSync(indexPath, 'utf-8');
  } else if (customPluginDefaultPageTemplates.length > 0 || fs.existsSync(`${templatesDir}/page.html`)) {
    // else look for default page template from the user
    contents = customPluginDefaultPageTemplates.length > 0
      ? fs.readFileSync(`${customPluginDefaultPageTemplates[0]}/page.html`, 'utf-8')
      : fs.readFileSync(`${templatesDir}/page.html`, 'utf-8');
  } else {
    // fallback to using Greenwood's stock page template
    contents = fs.readFileSync(path.join(__dirname, '../../templates/page.html'), 'utf-8');
  }

  return contents;
};

const getAppTemplate = (contents, templatesDir, customImports = [], contextPlugins) => {
  function sliceTemplate(template, pos, needle, replacer) {
    return template.slice(0, pos) + template.slice(pos).replace(needle, replacer);
  }
  
  const userAppTemplatePath = `${templatesDir}app.html`;
  const customAppTemplates = getCustomPageTemplates(contextPlugins, 'app');

  let appTemplateContents = customAppTemplates.length > 0
    ? fs.readFileSync(`${customAppTemplates[0]}/app.html`, 'utf-8')
    : fs.existsSync(userAppTemplatePath)
      ? fs.readFileSync(userAppTemplatePath, 'utf-8')
      : fs.readFileSync(path.join(__dirname, '../../templates/app.html'), 'utf-8');

  const root = htmlparser.parse(contents, {
    script: true,
    style: true,
    noscript: true,
    pre: true
  });

  if (!root.valid) {
    console.debug('ERROR: Invalid HTML detected');
    appTemplateContents = appTemplateContents.replace('<body>', `
      <body>
        <div style="position: absolute; width: 30%; border: solid 1px red; background-color: white; opacity: 0.67">
          <p>Malformed HTML detected, please check your closing tags or an <a href="https://www.google.com/search?q=html+formatter" target="_blank" rel="nopener noreferrer">HTML formatter</a>.</p>
          <details>
            <pre>
              ${contents.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')}
            </pre>
          </details>
        </div>
    `);

    appTemplateContents = appTemplateContents.replace(/<page-outlet><\/page-outlet>/, '');
  } else {
    const body = root.querySelector('body') ? root.querySelector('body').innerHTML : '';
    const headScripts = root.querySelectorAll('head script');
    const headLinks = root.querySelectorAll('head link');
    const headMeta = root.querySelectorAll('head meta');
    const headStyles = root.querySelectorAll('head style');
    const headTitle = root.querySelector('head title');

    appTemplateContents = appTemplateContents.replace(/<page-outlet><\/page-outlet>/, body);

    if (headTitle) {
      appTemplateContents = appTemplateContents.replace(/<title>(.*)<\/title>/, `<title>${headTitle.rawText}</title>`);
    }

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
        const source = script.text
          .replace(/\$/g, '$$$'); // https://github.com/ProjectEvergreen/greenwood/issues/656

        if (matchPos > 0) {
          appTemplateContents = sliceTemplate(appTemplateContents, matchPos, matchNeedle, `</script>\n
            <script${attributes}>
              ${source}
            </script>\n
          `);
        } else {
          appTemplateContents = appTemplateContents.replace('</head>', `
              <script${attributes}>
                ${source}
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

    headMeta.forEach((meta) => {
      appTemplateContents = appTemplateContents.replace('<head>', `
        <head>
          <meta ${meta.rawAttrs}/>
      `);
    });

    customImports.forEach((customImport) => {
      const extension = path.extname(customImport);

      switch (extension) {

        case '.js':
          appTemplateContents = appTemplateContents.replace('</head>', `
              <script src="${customImport}" type="module"></script>
            </head>
          `);
          break;
        case '.css':
          appTemplateContents = appTemplateContents.replace('</head>', `
            <link rel="stylesheet" href="${customImport}"></link>
            </head>
          `);
          break;

        default:
          break;

      }
    });
  }

  return appTemplateContents;
};

const getUserScripts = (contents, context) => {
  // polyfill chromium for WC support
  // https://lit.dev/docs/tools/requirements/#polyfills
  if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
    const { projectDirectory, userWorkspace } = context;
    const dependencies = fs.existsSync(path.join(userWorkspace, 'package.json')) // handle monorepos first
      ? JSON.parse(fs.readFileSync(path.join(userWorkspace, 'package.json'), 'utf-8')).dependencies
      : fs.existsSync(path.join(projectDirectory, 'package.json'))
        ? JSON.parse(fs.readFileSync(path.join(projectDirectory, 'package.json'), 'utf-8')).dependencies
        : {};

    const litPolyfill = dependencies && dependencies.lit
      ? '<script src="/node_modules/lit/polyfill-support.js"></script>\n'
      : '';

    contents = contents.replace('<head>', `
      <head>
        ${litPolyfill}
        <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
    `);
  }
  return contents;
};

const getMetaContent = (url, config, contents) => {
  const existingTitleMatch = contents.match(/<title>(.*)<\/title>/);
  const existingTitleCheck = !!(existingTitleMatch && existingTitleMatch[1] && existingTitleMatch[1] !== '');

  const title = existingTitleCheck
    ? existingTitleMatch[1]
    : config.title;
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

  // add an empty <title> if it's not already there
  if (!existingTitleMatch) {
    contents = contents.replace('<head>', '<head><title></title>');
  }

  contents = contents.replace(/<title>(.*)<\/title>/, `<title>${title}</title>`);
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
    return path.normalize(url.replace(this.compilation.context.userWorkspace, ''));
  }

  async shouldServe(url, headers) {
    const { pagesDir } = this.compilation.context;
    const relativeUrl = this.getRelativeUserworkspaceUrl(url);
    const isClientSideRoute = this.compilation.config.mode === 'spa' && (headers.request.accept || '').indexOf(this.contentType) >= 0;
    const barePath = relativeUrl.endsWith(path.sep)
      ? `${pagesDir}${relativeUrl}index`
      : `${pagesDir}${relativeUrl.replace('.html', '')}`;
    
    return Promise.resolve(this.extensions.indexOf(path.extname(relativeUrl)) >= 0
      || path.extname(relativeUrl) === '') && (fs.existsSync(`${barePath}.html`) || barePath.substring(barePath.length - 5, barePath.length) === 'index')
      || fs.existsSync(`${barePath}.md`)
      || fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`)
      || isClientSideRoute;
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const config = Object.assign({}, this.compilation.config);
        const { pagesDir, userTemplatesDir } = this.compilation.context;
        const { mode } = this.compilation.config;
        const normalizedUrl = this.getRelativeUserworkspaceUrl(url);
        let customImports;

        let body = '';
        let template = null;
        let processedMarkdown = null;
        const barePath = normalizedUrl.endsWith(path.sep)
          ? `${pagesDir}${normalizedUrl}index`
          : `${pagesDir}${normalizedUrl.replace('.html', '')}`;
        const isMarkdownContent = fs.existsSync(`${barePath}.md`)
          || fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`)
          || fs.existsSync(`${barePath.replace(`${path.sep}index`, '.md')}`);
        
        if (isMarkdownContent) {
          const markdownPath = fs.existsSync(`${barePath}.md`)
            ? `${barePath}.md`
            : fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`)
              ? `${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`
              : `${pagesDir}${url.replace(`${path.sep}index.html`, '.md')}`;
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

            if (attributes.imports) {
              customImports = attributes.imports;
            }
          }
        }

        // get context plugins
        const contextPlugins = this.compilation.config.plugins.filter((plugin) => {
          return plugin.type === 'context';
        }).map((plugin) => {
          return plugin.provider(this.compilation);
        });

        if (mode === 'spa') {
          body = fs.readFileSync(this.compilation.graph[0].path, 'utf-8');
        } else {
          body = getPageTemplate(barePath, userTemplatesDir, template, contextPlugins);
        }

        body = getAppTemplate(body, userTemplatesDir, customImports, contextPlugins);  
        body = getUserScripts(body, this.compilation.context);
        body = getMetaContent(normalizedUrl.replace(/\\/g, '/'), config, body);
        
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
        const hasHead = body.match(/\<head>(.*)<\/head>/s);

        if (hasHead && hasHead.length > 0) {
          let contents = hasHead[0];

          contents = contents.replace(/<script src="(.*lit\/polyfill-support.js)"><\/script>/, '');
          contents = contents.replace(/<script src="(.*webcomponents-bundle.js)"><\/script>/, '');
          contents = contents.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
          contents = contents.replace(/<script defer="" src="(.*es-module-shims.js)"><\/script>/, '');
          contents = contents.replace(/type="module-shim"/g, 'type="module"');

          body = body.replace(/\<head>(.*)<\/head>/s, contents.replace(/\$/g, '$$$')); // https://github.com/ProjectEvergreen/greenwood/issues/656);
        }
    
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