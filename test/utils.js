const glob = require('glob-promise');
const path = require('path');

function tagsMatch(tagName, html, expected = null) {
  const openTagRegex = new RegExp(`<${tagName}`, 'g');
  const closeTagRegex = new RegExp(`<\/${tagName.replace('>', '')}>`, 'g');
  const openingCount = (html.match(openTagRegex) || []).length;
  const closingCount = (html.match(closeTagRegex) || []).length;
  const expectedMatches = parseInt(expected, 10) ? expected : openingCount;
  
  return openingCount === closingCount && openingCount === expectedMatches;
}

function getSetupFiles(outputPath) {
  return [{
    source: path.join(process.cwd(), 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js'),
    destination: path.join(outputPath, 'node_modules/@webcomponents/webcomponentsjs/webcomponents-bundle.js')
  }, {
    source: path.join(process.cwd(), 'node_modules/es-module-shims/dist/es-module-shims.js'),
    destination: path.join(outputPath, 'node_modules/es-module-shims/dist/es-module-shims.js')
  }];
}

function getOutputTeardownFiles(outputPath) {
  return [
    path.join(outputPath, '.greenwood'),
    path.join(outputPath, 'public'),
    path.join(outputPath, 'node_modules')
  ];
}

async function getDependencyFiles(sourcePath, outputPath) {
  const files = await glob(sourcePath);

  return files.map((lib) => {
    return {
      source: path.join(lib),
      destination: path.join(outputPath, path.basename(lib))
    };
  });
}

module.exports = {
  getDependencyFiles,
  getOutputTeardownFiles,
  getSetupFiles,
  tagsMatch
};