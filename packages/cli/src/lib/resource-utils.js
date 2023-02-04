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
  return new Response(source.body, {
    headers
  });
}

// On Windows, a URL with a drive letter like C:/ thinks it is a protocol and so prepends a /, e.g. /C:/
// This is fine with never fs methods that Greenwood uses, but tools like Rollupand PostCSS will need this handled manually
function normalizePathnameForWindows(url) {
  const windowsDriveRegex = /\/[a-zA-Z]{1}:\//;
  const { pathname = '' } = url;

  if (windowsDriveRegex.test(pathname)) {
   const driveMatch = pathname.match(windowsDriveRegex)[0];

   return pathname.replace(driveMatch, driveMatch.replace('/', ''))
  }

  return pathname;
}

export {
  mergeResponse,
  modelResource,
  normalizePathnameForWindows
};