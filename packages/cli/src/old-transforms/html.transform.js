/* eslint-disable complexity */
// TODO ^^
const acorn = require('acorn');
const { promises: fsp } = require('fs');
const fs = require('fs');
const path = require('path');
const frontmatter = require('front-matter');
const htmlparser = require('node-html-parser');
const rehypeStringify = require('rehype-stringify');
const remarkFrontmatter = require('remark-frontmatter');
const remarkParse = require('remark-parse');
const remarkRehype = require('remark-rehype');
const unified = require('unified');
const walk = require('acorn-walk');

module.exports = filterHTML = async (ctx, config, userWorkspace) => {
  return new Promise(async (resolve, reject) => {
    try {
      // TODO filter out node modules, only page / user requests from brower
      // TODO make sure this only happens for "pages", nor partials or fixtures, templates, et)
      if (ctx.request.url.endsWith('/') || ctx.request.url.endsWith('.html')) {
        // console.log('URL ends with / or endsWith.html');
        // TODO get port from compilation
        // ctx.redirect(`http://localhost:1984${ctx.url}index.html`);
        // }
        let title = config.title;

        const metaOutletContent = config.meta.map(item => {
          let metaHtml = '';
        
          // TODO better way to implememnt this?  should we implement this?
          for (const [key, value] of Object.entries(item)) {
            const isOgUrl = item.property === 'og:url' && key === 'content';
            const hasTrailingSlash = isOgUrl && value[value.length - 1] === '/';
            const contextualValue = isOgUrl
              ? hasTrailingSlash
                ? `${value}${ctx.url.replace('/', '')}`
                : `${value}${ctx.url === '/' ? '' : ctx.url}`
              : value;
              
            metaHtml += ` ${key}="${contextualValue}"`;
          }

          return item.rel
            ? `<link${metaHtml}/>`
            : `<meta${metaHtml}/>`;
        }).join('\n');

        // TODO get pages path from compilation
        const barePath = ctx.request.url.endsWith('/')
          ? `${userWorkspace}/pages${ctx.request.url}index`
          : `${userWorkspace}/pages${ctx.request.url.replace('.html', '')}`;

        // console.debug('bare path', barePath);

        let contents = `
          <!DOCTYPE html>
          <html lang="en" prefix="og:http://ogp.me/ns#">
            <head>
              <title>${title}</title>
              <meta charset='utf-8'>
              <meta name='viewport' content='width=device-width, initial-scale=1'/>
              <meta-outlet></meta-outlet>
            </head>
            <body>
              <section>
                <content-outlet>
                  <h1>Welcome to my website!</h1>
                </content-outlet>
              </section>
            </body>
          </html>
        `;

        if (fs.existsSync(`${barePath}.html`)) {
          // console.debug('this route exists as HTML');
          contents = await fsp.readFile(`${barePath}.html`, 'utf-8');
        } else if (fs.existsSync(`${barePath}.md`) 
          || fs.existsSync(`${userWorkspace}/pages${ctx.url.replace('/index.html', '.md')}`) 
          || fs.existsSync(`${barePath.replace('/index', '.md')}`)) {
          
          // TODO all this lookup could probably be handled a bit more gracefully perhaps?
          // console.debug('this route exists as markdown');
          const markdownPath = fs.existsSync(`${barePath}.md`)
            ? `${barePath}.md`
            : fs.existsSync(`${barePath.replace('/index', '.md')}`)
              ? `${barePath.replace('/index', '.md')}`
              : `${userWorkspace}/pages${ctx.url.replace('/index.html', '.md')}`;
          const markdownContents = await fsp.readFile(markdownPath, 'utf-8');

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
          const fm = frontmatter(markdownContents);
          const processedMarkdown = await unified()
            .use(remarkParse) // parse markdown into AST
            .use(remarkFrontmatter) // extract frontmatter from AST
            .use(...remarkPlugins) // apply userland remark plugins
            .use(remarkRehype, { allowDangerousHtml: true }) // convert from markdown to HTML AST
            .use(...rehypePlugins) // apply userland rehype plugins
            .use(rehypeStringify) // convert AST to HTML string
            .process(markdownContents);

          // TODO use an app template
          if (fm.attributes.template) {
            contents = await fsp.readFile(`${userWorkspace}/templates/${fm.attributes.template}.html`, 'utf-8');
          } else if (fs.existsSync(`${userWorkspace}/templates/page.html`)) {
            // console.debug('has a page template!');
            contents = await fsp.readFile(`${userWorkspace}/templates/page.html`, 'utf-8');
          }

          // use page title
          if (fm.attributes.title) {
            title = `${title} - ${fm.attributes.title}`;
          }

          contents = contents.replace(/\<content-outlet>(.*)<\/content-outlet>/s, processedMarkdown.contents);
        } else if (fs.existsSync(`${userWorkspace}/templates/page.html`)) {
          // console.debug('only has a page template');
          const page = await fsp.readFile(`${userWorkspace}/templates/page.html`, 'utf-8');
          
          contents = page.replace(/\<content-outlet>(.*)<\/content-outlet>/s, contents.match(/\<content-outlet>(.*)<\/content-outlet>/s)[0]);
        }

        const appTemplate = `${userWorkspace}/templates/app.html`;

        if (fs.existsSync(appTemplate)) {
          let appTemplateContents = fs.readFileSync(appTemplate, 'utf-8');
          const root = htmlparser.parse(contents, {
            script: true,
            style: true,
            noscript: true,
            pre: true
          });
          const body = root.querySelector('body');
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

          contents = appTemplateContents;
        }
        
        // TODO use an HTML parser?  https://www.npmjs.com/package/node-html-parser
        if (process.env.__GWD_COMMAND__ === 'develop') { // eslint-disable-line no-underscore-dangle
          // TODO setup and teardown should be done together
          // console.debug('running in develop mode, attach live reload script');
          contents = contents.replace('</head>', `
              <script src="http://localhost:35729/livereload.js?snipver=1"></script>
            </head>
          `);
        }

        contents = contents.replace(/type="module"/g, 'type="module-shim"');
        
        const importMap = {};
        const userPackageJson = fs.existsSync(`${userWorkspace}/package.json`)
          ? require(path.join(userWorkspace, 'package.json')) // its a monorepo?
          : fs.existsSync(`${process.cwd()}/package.json`)
            ? require(path.join(process.cwd(), 'package.json'))
            : {};

        // console.debug('userPackageJson', userPackageJson);
        // console.debug('dependencies', userPackageJson.dependencies);
        
        Object.keys(userPackageJson.dependencies || {}).forEach(dependency => {
          const packageRootPath = path.join(process.cwd(), './node_modules', dependency);
          const packageJsonPath = path.join(packageRootPath, 'package.json');
          const packageJson = require(packageJsonPath);
          const packageEntryPointPath = path.join(process.cwd(), './node_modules', dependency, packageJson.main);
          const packageFileContents = fs.readFileSync(packageEntryPointPath, 'utf-8');

          walk.simple(acorn.parse(packageFileContents, { sourceType: 'module' }), {
            ImportDeclaration(node) {
              // console.log('Found a ImportDeclaration');
              const sourceValue = node.source.value;

              if (sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
                // console.log(`found a bare import for ${sourceValue}!!!!!`);
                importMap[sourceValue] = `/node_modules/${sourceValue}`;
              }
            },
            ExportNamedDeclaration(node) {
              // console.log('Found a ExportNamedDeclaration');
              const sourceValue = node && node.source ? node.source.value : '';

              if (sourceValue.indexOf('.') !== 0 && sourceValue.indexOf('http') !== 0) {
                // console.log(`found a bare export for ${sourceValue}!!!!!`);
                importMap[sourceValue] = `/node_modules/${sourceValue}`;
              }
            }
          });
          
          importMap[dependency] = `/node_modules/${dependency}/${packageJson.main}`;
        });

        // console.log('importMap all complete', importMap);
        
        contents = contents.replace('<head>', `
          <head>
            <script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>
            <script type="importmap-shim">
              {
                "imports": ${JSON.stringify(importMap, null, 1)}
              }
            </script>
        `);

        if (process.env.__GWD_COMMAND__ === 'build') { // eslint-disable-line no-underscore-dangle
          // TODO setup and teardown should be done together
          // console.debug('running in build mode, polyfill WebComponents for puppeteer');
          contents = contents.replace('<head>', `
            <head>
              <script src="/node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js"></script>
          `);
        }

        contents = contents.replace('<meta-outlet></meta-outlet>', metaOutletContent);

        // TODO make smarter so that if it already exists, then leave it alone
        contents = contents.replace(/<title>(.*)<\/title>/, '');
        contents = contents.replace('<head>', `<head><title>${title}</title>`);

        ctx.set('Content-Type', 'text/html');
        ctx.body(contents);
      }
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};