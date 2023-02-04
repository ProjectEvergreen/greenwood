import fs from 'fs/promises';
import { hashString } from '../lib/hashing-utils.js';

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

  source.headers.forEach((value, key) => {
    // TODO better way to handle Response automatically setting content-type
    const isDefaultHeader = key.toLowerCase() === 'content-type' && value === 'text/plain;charset=UTF-8';

    if (!isDefaultHeader) {
      headers.set(key, value);
    }
  });

  // TODO handle merging in state (aborted, type, status, etc)
  // https://github.com/ProjectEvergreen/greenwood/issues/1048
  return new Response(source.body, {
    headers
  });
}

// On Windows, a URL with a drive letter like C:/ thinks it is a protocol and so prepends a /, e.g. /C:/
// This is fine with never fs methods that Greenwood uses, but tools like Rollupand PostCSS will need this handled manually
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

  for (let i = 0, l = segments.length - 1; i < l; i += 1) {
    const nextSegments = segments.slice(i);
    const urlToCheck = new URL(`./${nextSegments.join('/')}`, rootUrl);

    if (await checkResourceExists(urlToCheck)) {
      reducedUrl = new URL(`${urlToCheck}${search}`);
    }
  }

  return reducedUrl;
}

export {
  checkResourceExists,
  mergeResponse,
  modelResource,
  normalizePathnameForWindows,
  resolveForRelativeUrl
};