import fs from 'fs/promises';
import { hashString } from './hashing-utils.js';
import htmlparser from 'node-html-parser';

async function modelResource(context, type, src = undefined, contents = undefined, optimizationAttr = undefined, rawAttributes = undefined) {
  const { projectDirectory, scratchDir, userWorkspace } = context;
  const extension = type === 'script' ? 'js' : 'css';
  let sourcePathURL;

  if (src) {
    sourcePathURL = src.startsWith('/node_modules')
      ? new URL(`.${src}`, projectDirectory)
      : src.startsWith('/')
        ? new URL(`.${src}`, userWorkspace)
        : new URL(`./${src.replace(/\.\.\//g, '').replace('./', '')}`, userWorkspace);

    contents = await fs.readFile(sourcePathURL, 'utf-8');
  } else {
    const scratchFileName = hashString(contents);

    sourcePathURL = new URL(`./${scratchFileName}.${extension}`, scratchDir);
    await fs.writeFile(sourcePathURL, contents);
  }

  return {
    src, // if <script src="..."></script> or <link href="..."></link>
    sourcePathURL, // src as a URL
    type,
    contents,
    optimizedFileName: undefined,
    optimizedFileContents: undefined,
    optimizationAttr,
    rawAttributes
  };
}

function mergeResponse(destination, source) {
  const headers = destination.headers || new Headers();
  const status = source.status || destination.status;

  source.headers.forEach((value, key) => {
    // TODO better way to handle Response automatically setting content-type
    // https://github.com/ProjectEvergreen/greenwood/issues/1049
    const isDefaultHeader = key.toLowerCase() === 'content-type' && value === 'text/plain;charset=UTF-8';

    if (!isDefaultHeader) {
      headers.set(key, value);
    }
  });

  // TODO handle merging in state (aborted, type, status, etc)
  // https://github.com/ProjectEvergreen/greenwood/issues/1048
  return new Response(source.body, {
    headers,
    status
  });
}

// On Windows, a URL with a drive letter like C:/ thinks it is a protocol and so prepends a /, e.g. /C:/
// This is fine with never fs methods that Greenwood uses, but tools like Rollup and PostCSS will need this handled manually
// https://github.com/rollup/rollup/issues/3779
function normalizePathnameForWindows(url) {
  const windowsDriveRegex = /\/[a-zA-Z]{1}:\//;
  const { pathname = '' } = url;

  if (windowsDriveRegex.test(pathname)) {
    const driveMatch = pathname.match(windowsDriveRegex)[0];

    return pathname.replace(driveMatch, driveMatch.replace('/', ''));
  }

  return pathname;
}

async function checkResourceExists(url) {
  try {
    await fs.access(url);
    return true;
  } catch (e) {
    return false;
  }
}

// turn relative paths into relatively absolute based on a known root directory
// * deep link route - /blog/releases/some-post
// * and a nested path in the template - ../../styles/theme.css
// so will get resolved as `${rootUrl}/styles/theme.css`
async function resolveForRelativeUrl(url, rootUrl) {
  const search = url.search || '';
  let reducedUrl;

  if (await checkResourceExists(new URL(`.${url.pathname}`, rootUrl))) {
    return new URL(`.${url.pathname}${search}`, rootUrl);
  }

  const segments = url.pathname.split('/').filter(segment => segment !== '');
  segments.shift();

  for (let i = 0, l = segments.length; i < l; i += 1) {
    const nextSegments = segments.slice(i);
    const urlToCheck = new URL(`./${nextSegments.join('/')}`, rootUrl);

    if (await checkResourceExists(urlToCheck)) {
      reducedUrl = new URL(`${urlToCheck}${search}`);
    }
  }

  return reducedUrl;
}

// TODO does this make more sense in bundle lifecycle?
// https://github.com/ProjectEvergreen/greenwood/issues/970
// or could this be done sooner (like in appTemplate building in html resource plugin)?
// Or do we need to ensure userland code / plugins have gone first
// before we can curate the final list of <script> / <style> / <link> tags to bundle
async function trackResourcesForRoute(html, compilation, route) {
  const { context } = compilation;
  const root = htmlparser.parse(html, {
    script: true,
    style: true
  });

  // intentionally support <script> tags from the <head> or <body>
  const scripts = await Promise.all(root.querySelectorAll('script')
    .filter(script => (
      isLocalLink(script.getAttribute('src')) || script.rawText)
      && script.rawAttrs.indexOf('importmap') < 0)
    .map(async(script) => {
      const src = script.getAttribute('src');
      const optimizationAttr = script.getAttribute('data-gwd-opt');
      const { rawAttrs } = script;

      if (src) {
        // <script src="...."></script>
        return await modelResource(context, 'script', src, null, optimizationAttr, rawAttrs);
      } else if (script.rawText) {
        // <script>...</script>
        return await modelResource(context, 'script', null, script.rawText, optimizationAttr, rawAttrs);
      }
    }));

  const styles = await Promise.all(root.querySelectorAll('style')
    .filter(style => !(/\$/).test(style.rawText) && !(/<!-- Shady DOM styles for -->/).test(style.rawText)) // filter out Shady DOM <style> tags that happen when using puppeteer
    .map(async(style) => await modelResource(context, 'style', null, style.rawText, null, style.getAttribute('data-gwd-opt'))));

  const links = await Promise.all(root.querySelectorAll('head link')
    .filter(link => {
      // <link rel="stylesheet" href="..."></link>
      return link.getAttribute('rel') === 'stylesheet'
        && link.getAttribute('href') && isLocalLink(link.getAttribute('href'));
    }).map(async(link) => {
      return modelResource(context, 'link', link.getAttribute('href'), null, link.getAttribute('data-gwd-opt'), link.rawAttrs);
    }));

  const resources = [
    ...scripts,
    ...styles,
    ...links
  ];

  resources.forEach(resource => {
    compilation.resources.set(resource.sourcePathURL.pathname, resource);
  });

  compilation.graph.find(page => page.route === route).resources = resources.map(resource => resource.sourcePathURL.pathname);

  return resources;
}

function isLocalLink(url = '') {
  return url !== '' && (url.indexOf('http') !== 0 && url.indexOf('//') !== 0);
}

export {
  checkResourceExists,
  mergeResponse,
  modelResource,
  normalizePathnameForWindows,
  resolveForRelativeUrl,
  trackResourcesForRoute
};