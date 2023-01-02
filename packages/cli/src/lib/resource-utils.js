import fs from 'fs';
import { hashString } from '../lib/hashing-utils.js';

// TODO could make async?
function modelResource(context, type, src = undefined, contents = undefined, optimizationAttr = undefined, rawAttributes = undefined) {
  const { projectDirectory, scratchDir, userWorkspace } = context;
  const extension = type === 'script' ? 'js' : 'css';
  const windowsDriveRegex = /\/[a-zA-Z]{1}:\//;
  let sourcePathURL;

  if (src) {
    sourcePathURL = src.startsWith('/node_modules')
      ? new URL(`./${src}`, projectDirectory) // pathToFileURL(path.join(projectDirectory, src)) // TODO (good first issue) get "real" location of node modules
      : new URL(`./${src.replace(/\.\.\//g, '').replace('./', '')}`, userWorkspace); // pathToFileURL(path.join(userWorkspace, src.replace(/\.\.\//g, '').replace('./', '')));

    contents = fs.readFileSync(sourcePathURL, 'utf-8');
  } else {
    const scratchFileName = hashString(contents);

    sourcePathURL = new URL(`./${scratchFileName}.${extension}`, scratchDir);
    fs.writeFileSync(sourcePathURL, contents);
  }

  // TODO (good first issue) handle for Windows adding extra / in front of drive letter for whatever reason :(
  // e.g. turn /C:/... -> C:/...
  // and also URL is readonly in NodeJS??
  if (windowsDriveRegex.test(sourcePathURL.pathname)) {
    const driveMatch = sourcePathURL.pathname.match(windowsDriveRegex)[0];

    sourcePathURL = {
      ...sourcePathURL,
      pathname: sourcePathURL.pathname.replace(driveMatch, driveMatch.replace('/', '')),
      href: sourcePathURL.href.replace(driveMatch, driveMatch.replace('/', ''))
    };
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

export { modelResource };