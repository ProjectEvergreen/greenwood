import fs from 'fs';
import { hashString } from '../lib/hashing-utils.js';
import path from 'path';
import { pathToFileURL } from 'url';

function modelResource(context, type, src = undefined, contents = undefined, optimizationAttr = undefined, rawAttributes = undefined) {
  const { projectDirectory, scratchDir, userWorkspace } = context;
  const extension = type === 'script' ? 'js' : 'css';
  let sourcePathURL;

  if (src) {
    sourcePathURL = src.indexOf('/node_modules') === 0
      ? pathToFileURL(path.join(projectDirectory, src)) // TODO get "real" location of node modules
      : pathToFileURL(path.join(userWorkspace, src.replace(/\.\.\//g, '').replace('./', '')));

    contents = fs.readFileSync(sourcePathURL, 'utf-8');
  } else {
    const scratchFileName = hashString(contents);

    sourcePathURL = pathToFileURL(path.join(scratchDir, `${scratchFileName}.${extension}`));
    fs.writeFileSync(sourcePathURL, contents);
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