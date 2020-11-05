const acorn = require('acorn');
const { promises: fsp } = require('fs');
const fs = require('fs');
const path = require('path');
const htmlparser = require('node-html-parser');
const walk = require('acorn-walk');

const getAppTemplate = async (barePath) => {
  if (fs.existsSync(`${barePath}.html`)) {
    // console.debug('this route exists as HTML');
    contents = await fsp.readFile(`${barePath}.html`, 'utf-8');
  } else {
    contents = await fsp.readFile(path.join(__dirname, '../templates/app.html'), 'utf-8');
  }
  return contents;
};

const getAppTemplateScripts = async (contents, userWorkspace) => {
  
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

const getUserScripts = (contents, userWorkspace) => {
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
  return contents;
};

const getMetaContent = (url, config, contents) => {

  const title = config.title;
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

  // console.log(contents);

  // TODO make smarter so that if it already exists, then leave it alone
  contents = contents.replace(/<title>(.*)<\/title>/, '');
  contents = contents.replace('<head>', `<head><title>${title}</title>`);
  contents = contents.replace('<meta-outlet></meta-outlet>', metaContent);

  return contents;
};

module.exports = {
  getAppTemplate,
  getAppTemplateScripts,
  getMetaContent,
  getUserScripts
};