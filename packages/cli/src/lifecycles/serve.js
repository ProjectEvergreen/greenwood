/* eslint-disable complexity */
// TODO ^^^
const acorn = require('acorn');
const { promises: fsp } = require('fs');
const fs = require('fs');
const frontmatter = require('front-matter');
const remarkFrontmatter = require('remark-frontmatter');
const raw = require('rehype-raw');
const html = require('rehype-stringify');
const Koa = require('koa');
const path = require('path');
const remark = require('remark-parse');
const remark2rehype = require('remark-rehype');
const unified = require('unified');
const walk = require('acorn-walk');

function getDevServer(compilation) {
  const { config, context } = compilation;
  const { userWorkspace, scratchDir } = context;
  const app = new Koa();

  // TODO export this an async function
  app.use(async ctx => {
    // console.debug('URL', ctx.request.url);
    
    // TODO filter out node modules, only page / user requests from brower
    if (ctx.request.url.endsWith('/')) {
      // console.log('URL ends with /');
      // TODO get port from compilation
      ctx.redirect(`http://localhost:1984${ctx.request.url}index.html`);
    }

    // make sure this only happens for "pages", nor partials or fixtures, templates, et)
    if (ctx.request.url.indexOf('.html') >= 0) {
      // TODO get this stuff from compilation
      let title = config.title;
      const metaOutletContent = config.meta.map(item => {
        let metaHtml = '';
      
        for (const [key, value] of Object.entries(item)) {
          metaHtml += ` ${key}="${value}"`;
        }
      
        return item.rel
          ? `<link${metaHtml}/>`
          : `<meta${metaHtml}/>`;
      }).join('\n');

      // TODO get pages path from compilation
      const barePath = `${userWorkspace}/pages${ctx.request.url.replace('.html', '')}`;
      // console.debug('bare path', barePath);

      // TODO use default page here if it exists?
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
                <content-outlet></content-outlet>
              </section>
            </body>
          </html>
      `;

      if (fs.existsSync(`${barePath}.html`)) {
        // console.debug('this route exists as HTML');
        contents = await fsp.readFile(`${barePath}.html`, 'utf-8');
      } else if (fs.existsSync(`${barePath}.md`) || fs.existsSync(`${userWorkspace}/pages${ctx.request.url.replace('/index.html', '.md')}`)) {
        // TODO all this lookup could probably be handled a bit more gracefully perhaps?
        const markdownPath = fs.existsSync(`${barePath}.md`)
          ? `${barePath}.md`
          : `${userWorkspace}/pages${ctx.request.url.replace('/index.html', '.md')}`;
        const markdownContents = await fsp.readFile(markdownPath, 'utf-8');

        // console.debug('this route exists as a markdown file', markdownPath);

        // TODO extract front matter contents from remark-frontmatter instead of frontmatter lib
        // TODO handle prism
        const fm = frontmatter(markdownContents);
        const processedMarkdown = await unified()
          .use(remark)
          .use(remarkFrontmatter)
          .use(remark2rehype, { allowDangerousHtml: true })
          .use(raw)
          .use(html)
          .process(markdownContents);

        // TODO use an app template
        if (fm.attributes.template) {
          contents = await fsp.readFile(`${userWorkspace}/templates/${fm.attributes.template}.html`, 'utf-8');
        } else {
          contents = await fsp.readFile(`${userWorkspace}/templates/page.html`, 'utf-8');
        }

        // use page title
        if (fm.attributes.title) {
          title = `${title} - ${fm.attributes.title}`;
        }

        contents = contents.replace('<content-outlet></content-outlet>', processedMarkdown.contents);
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
      const userPackageJson = fs.existsSync(path.join(userWorkspace, 'package.json'))
        ? require(path.join(userWorkspace, 'package.json')) // its a monorepo?
        : require(path.join(process.cwd(), 'package.json'));

      // console.debug('userPackageJson', userPackageJson);
      // console.debug('dependencies', userPackageJson.dependencies);
      
      Object.keys(userPackageJson.dependencies).forEach(dependency => {
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
      ctx.body = contents;
    }

    if (ctx.request.url.indexOf('/node_modules') >= 0) {
      const modulePath = path.join(process.cwd(), ctx.request.url);
      const contents = await fsp.readFile(modulePath, 'utf-8'); // have to handle CJS vs ESM?
      const type = ctx.request.url.indexOf('.js') > 0
        ? 'text/javascript'
        : 'text/css'; // TODO eve components assume a bundler

      ctx.set('Content-Type', type);
      ctx.body = contents;
    }

    // TODO This is here because of ordering, should make JS / JSON matching less greedy
    // handle things outside if workspace, like a root directory resolver plugin?
    if (ctx.request.url.indexOf('.json') >= 0) {
      // console.debug('JSON file request!', ctx.request.url);'

      if (ctx.request.url.indexOf('graph.json') >= 0) {
        const json = await fsp.readFile(path.join(scratchDir, 'graph.json'), 'utf-8');

        ctx.set('Content-Type', 'application/json');
        ctx.body = JSON.parse(json);
      } else {
        const json = await fsp.readFile(path.join(userWorkspace, ctx.request.url), 'utf-8');

        ctx.set('Content-Type', 'text/javascript');
        ctx.body = `
          export default ${json}
        `;
      }
    }

    if (ctx.request.url.indexOf('/node_modules') < 0 && ctx.request.url.indexOf('.js') >= 0 && ctx.request.url.indexOf('.json') < 0) {
      const jsPath = path.join(userWorkspace, ctx.request.url);
      const contents = await fsp.readFile(jsPath, 'utf-8');

      ctx.set('Content-Type', 'text/javascript');
      ctx.body = contents;
    }

    if (ctx.request.url.indexOf('.css') >= 0) {
      const destHeader = ctx.request.header['sec-fetch-dest'];
      const cssPath = ctx.request.url.indexOf('/node_modules') >= 0
        ? path.join(process.cwd(), ctx.request.url)
        : path.join(userWorkspace, ctx.request.url);
      const css = await fsp.readFile(cssPath, 'utf-8');

      // <style> tag used
      if (destHeader === 'style') {
        ctx.set('Content-Type', 'text/css');
        ctx.body = css;
      } else if (destHeader === 'empty') {
        // assume JS import being being used
        ctx.set('Content-Type', 'text/javascript');
        // TODO line breaks are bad for fetch, need to return CSS string all on one line
        ctx.body = `
          const css = "${css.replace(/\r?\n|\r/g, ' ')}";

          export default css;
        `;
      }
    }

    if (ctx.request.url.indexOf('assets/') >= 0 && ctx.request.url.indexOf('.css') < 0) {
      const assetPath = path.join(userWorkspace, ctx.request.url);
      const ext = path.extname(assetPath);
      const type = ext === '.svg'
        ? `${ext.replace('.', '')}+xml`
        : ext.replace('.', '');

      // console.debug('assetPath', assetPath);
      // console.debug('asset ext', ext);

      if (['.jpg', '.png', '.gif', '.svg'].includes(ext)) {
        ctx.set('Content-Type', `image/${type}`);

        if (ext === '.svg') {
          ctx.body = await fsp.readFile(assetPath, 'utf-8');
        } else {
          ctx.body = await fsp.readFile(assetPath); 
        }
      } else if (['.woff2', '.woff', '.ttf'].includes(ext)) {
        ctx.set('Content-Type', `font/${type}`);
        ctx.body = await fsp.readFile(assetPath);
      } else if (['.ico'].includes(ext)) {
        ctx.set('Content-Type', `image/x-icon`);
        ctx.body = await fsp.readFile(assetPath);
      } else {
        ctx.set('Content-Type', `text/${type}`);
        ctx.body = await fsp.readFile(assetPath, 'utf-8');
      }
    }

  });

  return app;
}

module.exports = {
  devServer: getDevServer
};