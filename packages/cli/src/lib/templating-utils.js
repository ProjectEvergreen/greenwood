import fs from 'fs/promises';
import htmlparser from 'node-html-parser';
import { checkResourceExists } from './resource-utils.js';
import { getPackageJson } from './node-modules-utils.js';

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

async function getPageTemplate(filePath, context, template, contextPlugins = []) {
  const { templatesDir, userTemplatesDir, pagesDir, projectDirectory } = context;
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
    contents = await fs.readFile(new URL('./404.html', templatesDir), 'utf-8');
  } else {
    // fallback to using Greenwood's stock page template
    contents = await fs.readFile(new URL('./page.html', templatesDir), 'utf-8');
  }

  return contents;
}

/* eslint-disable-next-line complexity */
async function getAppTemplate(pageTemplateContents, context, customImports = [], contextPlugins, enableHud, frontmatterTitle) {
  const { templatesDir, userTemplatesDir } = context;
  const userAppTemplateUrl = new URL('./app.html', userTemplatesDir);
  const customAppTemplatesFromPlugins = await getCustomPageTemplatesFromPlugins(contextPlugins, 'app');
  const hasCustomUserAppTemplate = await checkResourceExists(userAppTemplateUrl);
  let appTemplateContents = customAppTemplatesFromPlugins.length > 0
    ? await fs.readFile(new URL('./app.html', customAppTemplatesFromPlugins[0]))
    : hasCustomUserAppTemplate
      ? await fs.readFile(userAppTemplateUrl, 'utf-8')
      : await fs.readFile(new URL('./app.html', templatesDir), 'utf-8');
  let mergedTemplateContents = '';

  const pageRoot = pageTemplateContents && htmlparser.parse(pageTemplateContents, {
    script: true,
    style: true,
    noscript: true,
    pre: true
  });
  const appRoot = htmlparser.parse(appTemplateContents, {
    script: true,
    style: true
  });

  if ((pageTemplateContents && !pageRoot.valid) || !appRoot.valid) {
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
    const pageBody = pageRoot && pageRoot.querySelector('body') ? pageRoot.querySelector('body').innerHTML : '';
    const pageTitle = pageRoot && pageRoot.querySelector('head title');
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

    const finalBody = pageTemplateContents
      ? appBody.replace(/<page-outlet><\/page-outlet>/, pageBody)
      : appBody;

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
          ${finalBody}
        </body>
      </html>
    `;
  }

  return mergedTemplateContents;
}

async function getUserScripts (contents, context) {
  // TODO get rid of lit polyfills in core
  // https://github.com/ProjectEvergreen/greenwood/issues/728
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
}

export {
  getAppTemplate,
  getPageTemplate,
  getUserScripts
};