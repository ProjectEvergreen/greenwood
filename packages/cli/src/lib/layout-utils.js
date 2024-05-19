import fs from 'fs/promises';
import htmlparser from 'node-html-parser';
import { checkResourceExists } from './resource-utils.js';
import { Worker } from 'worker_threads';

async function getCustomPageLayoutsFromPlugins(compilation, layoutName) {
  // TODO confirm context plugins work for SSR
  // TODO support context plugins for more than just HTML files
  const contextPlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'context';
  }).map((plugin) => {
    return plugin.provider(compilation);
  });

  const customLayoutLocations = [];
  const layoutDir = contextPlugins
    .map(plugin => plugin.layouts)
    .flat();

  for (const layoutDirUrl of layoutDir) {
    if (layoutName) {
      const layoutUrl = new URL(`./${layoutName}.html`, layoutDirUrl);

      if (await checkResourceExists(layoutUrl)) {
        customLayoutLocations.push(layoutUrl);
      }
    }
  }

  return customLayoutLocations;
}

async function getPageLayout(filePath, compilation, layout) {
  const { context } = compilation;
  const { layoutsDir, userLayoutsDir, pagesDir, projectDirectory } = context;
  const customPluginDefaultPageLayouts = await getCustomPageLayoutsFromPlugins(compilation, 'page');
  const customPluginPageLayouts = await getCustomPageLayoutsFromPlugins(compilation, layout);
  const extension = filePath.split('.').pop();
  const is404Page = filePath.startsWith('404') && extension === 'html';
  const hasCustomStaticLayout = await checkResourceExists(new URL(`./${layout}.html`, userLayoutsDir));
  const hasCustomDynamicLayout = await checkResourceExists(new URL(`./${layout}.js`, userLayoutsDir));
  const hasPageLayout = await checkResourceExists(new URL('./page.html', userLayoutsDir));
  const hasCustom404Page = await checkResourceExists(new URL('./404.html', pagesDir));
  const isHtmlPage = extension === 'html' && await checkResourceExists(new URL(`./${filePath}`, projectDirectory));
  let contents;

  if (layout && (customPluginPageLayouts.length > 0 || hasCustomStaticLayout)) {
    // use a custom layout, usually from markdown frontmatter
    contents = customPluginPageLayouts.length > 0
      ? await fs.readFile(new URL(`./${layout}.html`, customPluginPageLayouts[0]), 'utf-8')
      : await fs.readFile(new URL(`./${layout}.html`, userLayoutsDir), 'utf-8');
  } else if (isHtmlPage) {
    // if the page is already HTML, use that as the layout, NOT accounting for 404 pages
    contents = await fs.readFile(new URL(`./${filePath}`, projectDirectory), 'utf-8');
  } else if (customPluginDefaultPageLayouts.length > 0 || (!is404Page && hasPageLayout)) {
    // else look for default page layout from the user
    // and 404 pages should be their own "top level" layout
    contents = customPluginDefaultPageLayouts.length > 0
      ? await fs.readFile(new URL('./page.html', customPluginDefaultPageLayouts[0]), 'utf-8')
      : await fs.readFile(new URL('./page.html', userLayoutsDir), 'utf-8');
  } else if (hasCustomDynamicLayout && !is404Page) {
    const routeModuleLocationUrl = new URL(`./${layout}.js`, userLayoutsDir);
    const routeWorkerUrl = compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider().executeModuleUrl;

    await new Promise(async (resolve, reject) => {
      const worker = new Worker(new URL('./ssr-route-worker.js', import.meta.url));

      worker.on('message', (result) => {

        if (result.body) {
          contents = result.body;
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
        compilation: JSON.stringify(compilation)
      });
    });
  } else if (is404Page && !hasCustom404Page) {
    contents = await fs.readFile(new URL('./404.html', layoutsDir), 'utf-8');
  } else {
    // fallback to using Greenwood's stock page layout
    contents = await fs.readFile(new URL('./page.html', layoutsDir), 'utf-8');
  }

  return contents;
}

/* eslint-disable-next-line complexity */
async function getAppLayout(pageLayoutContents, compilation, customImports = [], frontmatterTitle) {
  const enableHud = compilation.config.devServer.hud;
  const { layoutsDir, userLayoutsDir } = compilation.context;
  const userStaticAppLayoutUrl = new URL('./app.html', userLayoutsDir);
  // TODO support more than just .js files
  const userDynamicAppLayoutUrl = new URL('./app.js', userLayoutsDir);
  const userHasStaticAppLayout = await checkResourceExists(userStaticAppLayoutUrl);
  const userHasDynamicAppLayout = await checkResourceExists(userDynamicAppLayoutUrl);
  const customAppLayoutsFromPlugins = await getCustomPageLayoutsFromPlugins(compilation, 'app');
  let dynamicAppLayoutContents;

  if (userHasDynamicAppLayout) {
    const routeWorkerUrl = compilation.config.plugins.find(plugin => plugin.type === 'renderer').provider().executeModuleUrl;

    await new Promise(async (resolve, reject) => {
      const worker = new Worker(new URL('./ssr-route-worker.js', import.meta.url));

      worker.on('message', (result) => {

        if (result.body) {
          dynamicAppLayoutContents = result.body;
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
        moduleUrl: userDynamicAppLayoutUrl.href,
        compilation: JSON.stringify(compilation)
      });
    });
  }

  let appLayoutContents = customAppLayoutsFromPlugins.length > 0
    ? await fs.readFile(new URL('./app.html', customAppLayoutsFromPlugins[0]))
    : userHasStaticAppLayout
      ? await fs.readFile(userStaticAppLayoutUrl, 'utf-8')
      : userHasDynamicAppLayout
        ? dynamicAppLayoutContents
        : await fs.readFile(new URL('./app.html', layoutsDir), 'utf-8');
  let mergedLayoutContents = '';

  const pageRoot = pageLayoutContents && htmlparser.parse(pageLayoutContents, {
    script: true,
    style: true,
    noscript: true,
    pre: true
  });
  const appRoot = htmlparser.parse(appLayoutContents, {
    script: true,
    style: true
  });

  if ((pageLayoutContents && !pageRoot.valid) || !appRoot.valid) {
    console.debug('ERROR: Invalid HTML detected');
    const invalidContents = !pageRoot.valid
      ? pageLayoutContents
      : appLayoutContents;

    if (enableHud) {
      appLayoutContents = appLayoutContents.replace('<body>', `
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

    mergedLayoutContents = appLayoutContents.replace(/<page-outlet><\/page-outlet>/, '');
  } else {
    const appTitle = appRoot ? appRoot.querySelector('head title') : null;
    const appBody = appRoot.querySelector('body') ? appRoot.querySelector('body').innerHTML : '';
    const pageBody = pageRoot && pageRoot.querySelector('body') ? pageRoot.querySelector('body').innerHTML : '';
    const pageTitle = pageRoot && pageRoot.querySelector('head title');
    const hasInterpolatedFrontmatter = pageTitle && pageTitle.rawText.indexOf('${globalThis.page.title}') >= 0
     || appTitle && appTitle.rawText.indexOf('${globalThis.page.title}') >= 0;

    const title = hasInterpolatedFrontmatter // favor frontmatter interpolation first
      ? pageTitle && pageTitle.rawText
        ? pageTitle.rawText
        : appTitle.rawText
      : frontmatterTitle // otherwise, work in order of specificity from page -> page layout -> app layout
        ? frontmatterTitle
        : pageTitle && pageTitle.rawText
          ? pageTitle.rawText
          : appTitle && appTitle.rawText
            ? appTitle.rawText
            : 'My App';

    const mergedHtml = pageRoot && pageRoot.querySelector('html').rawAttrs !== ''
      ? `<html ${pageRoot.querySelector('html').rawAttrs}>`
      : appRoot.querySelector('html').rawAttrs !== ''
        ? `<html ${appRoot.querySelector('html').rawAttrs}>`
        : '<html>';

    const mergedMeta = [
      ...appRoot.querySelectorAll('head meta'),
      ...[...(pageRoot && pageRoot.querySelectorAll('head meta')) || []]
    ].join('\n');

    const mergedLinks = [
      ...appRoot.querySelectorAll('head link'),
      ...[...(pageRoot && pageRoot.querySelectorAll('head link')) || []]
    ].join('\n');

    const mergedStyles = [
      ...appRoot.querySelectorAll('head style'),
      ...[...(pageRoot && pageRoot.querySelectorAll('head style')) || []],
      ...customImports.filter(resource => resource.split('.').pop() === 'css')
        .map(resource => `<link rel="stylesheet" href="${resource}"></link>`)
    ].join('\n');

    const mergedScripts = [
      ...appRoot.querySelectorAll('head script'),
      ...[...(pageRoot && pageRoot.querySelectorAll('head script')) || []],
      ...customImports.filter(resource => resource.split('.').pop() === 'js')
        .map(resource => `<script src="${resource}" type="module"></script>`)
    ].join('\n');

    const finalBody = pageLayoutContents
      ? appBody.replace(/<page-outlet><\/page-outlet>/, pageBody)
      : appBody;

    mergedLayoutContents = `<!DOCTYPE html>
      ${mergedHtml}
        <head>
          <title>${title}</title>
          ${mergedMeta}
          ${mergedLinks}
          ${mergedStyles}
          ${mergedScripts}
        </head>
        <body>
          ${finalBody}
        </body>
      </html>
    `;
  }

  return mergedLayoutContents;
}

async function getUserScripts (contents, compilation) {
  const { config } = compilation;

  contents = contents.replace('<head>', `
    <head>
      <script data-gwd="base-path">
        globalThis.__GWD_BASE_PATH__ = '${config.basePath}';
      </script>
  `);

  return contents;
}

export {
  getAppLayout,
  getPageLayout,
  getUserScripts
};