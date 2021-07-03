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
  const pageIsHtmlPath = `${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.html`;

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
  } else {
    // fallback to using Greenwood's stock page template
    contents = fs.readFileSync(path.join(__dirname, '../../templates/page.html'), 'utf-8');
  }

  return contents;
};

const getAppTemplate = (contents, userWorkspace, customImports = []) => {
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

  return appTemplateContents;
};

const getUserScripts = (contents, projectDirectory) => {
  if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
    const wcBundleFilename = '/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js';
    const wcBundlePath = fs.existsSync(path.join(projectDirectory, wcBundleFilename))
      ? wcBundleFilename
      : 'https://unpkg.com/@webcomponents/webcomponentsjs@2.4.4/webcomponents-bundle.js';

    contents = contents.replace('<head>', `
      <head>
        <script src="${wcBundlePath}"></script>
    `);
  }
  return contents;
};

const getMetaContent = (url, config, contents) => {
  const existingTitleMatch = contents.match(/<title>(.*)<\/title>/);
  const existingTitleCheck = existingTitleMatch && existingTitleMatch[1] && existingTitleMatch !== '';

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

  // add a title if its not already there
  if (!existingTitleCheck) {
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

  async shouldServe(url) {
    const { userWorkspace } = this.compilation.context;
    const relativeUrl = this.getRelativeUserworkspaceUrl(url);
    const barePath = relativeUrl.endsWith(path.sep)
      ? `${userWorkspace}${path.sep}pages${relativeUrl}index`
      : `${userWorkspace}${path.sep}pages${relativeUrl.replace('.html', '')}`;
    
    return Promise.resolve(this.extensions.indexOf(path.extname(relativeUrl)) >= 0 || path.extname(relativeUrl) === '') && 
    (fs.existsSync(`${barePath}.html`) || barePath.substring(barePath.length - 5, barePath.length) === 'index')
    || fs.existsSync(`${barePath}.md`) || fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`);
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        const config = Object.assign({}, this.compilation.config);
        const { userWorkspace, projectDirectory } = this.compilation.context;
        const { mode } = this.compilation.config;
        const normalizedUrl = this.getRelativeUserworkspaceUrl(url);
        let customImports;

        let body = '';
        let template = null;
        let processedMarkdown = null;
        const barePath = normalizedUrl.endsWith(path.sep)
          ? `${userWorkspace}${path.sep}pages${normalizedUrl}index`
          : `${userWorkspace}${path.sep}pages${normalizedUrl.replace('.html', '')}`;
        const isMarkdownContent = fs.existsSync(`${barePath}.md`)
          || fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`)
          || fs.existsSync(`${barePath.replace(`${path.sep}index`, '.md')}`);
        
        if (isMarkdownContent) {
          const markdownPath = fs.existsSync(`${barePath}.md`)
            ? `${barePath}.md`
            : fs.existsSync(`${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`)
              ? `${barePath.substring(0, barePath.lastIndexOf(`${path.sep}index`))}.md`
              : `${userWorkspace}${path.sep}pages${url.replace(`${path.sep}index.html`, '.md')}`;
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
      
        if (mode === 'spa') {
          body = fs.readFileSync(this.compilation.graph[0].path, 'utf-8');
        } else {
          body = getPageTemplate(barePath, userWorkspace, template);
        }

        body = getAppTemplate(body, userWorkspace, customImports);  
        body = getUserScripts(body, projectDirectory);
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

          contents = contents.replace(/<script src="(.*webcomponents-bundle.js)"><\/script>/, '');
          contents = contents.replace(/<script type="importmap-shim">.*?<\/script>/s, '');
          contents = contents.replace(/<script defer="" src="(.*es-module-shims.js)"><\/script>/, '');
          contents = contents.replace(/type="module-shim"/g, 'type="module"');

          body = body.replace(/\<head>(.*)<\/head>/s, contents);
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