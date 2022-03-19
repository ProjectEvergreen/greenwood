import fs from 'fs';
import glob from 'glob-promise';
import path from 'path';

async function rreaddir (dir, allFiles = []) {
  const files = (await fs.promises.readdir(dir)).map(f => path.join(dir, f));

  allFiles.push(...files);

  await Promise.all(files.map(async f => (
    await fs.promises.stat(f)).isDirectory() && rreaddir(f, allFiles
  )));

  return allFiles;
}

// https://stackoverflow.com/a/30405105/417806
async function copyFile(source, target) {
  const rd = fs.createReadStream(source);
  const wr = fs.createWriteStream(target);

  try {
    return await new Promise((resolve, reject) => {
      rd.on('error', reject);
      wr.on('error', reject);
      wr.on('finish', resolve);
      rd.pipe(wr);
    });
  } catch (error) {
    console.error('ERROR', error);
    rd.destroy();
    wr.end();
  }
}

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

async function copyDirectory(sourcePath, outputPath) {
  const sourceContents = await rreaddir(sourcePath);

  console.debug({ sourcePath });
  console.debug({ outputPath });

  await fs.promises.mkdir(outputPath, { recursive: true });

  sourceContents.forEach((filepath) => {
    const target = decodeURIComponent(path.normalize(filepath.replace(sourcePath, outputPath)));
    const stats = fs.lstatSync(filepath);

    console.debug({ filepath });
    console.debug({ target });
    if (stats.isDirectory() && (!filepath.endsWith('Contents') || !filepath.endsWith('LICENSE')) && !fs.existsSync(target)) {
      console.debug('mkdir', target);
      fs.mkdirSync(target);
    } else if (stats.isFile()) {
      copyFile(filepath, target);
    }
  });
}

export {
  getDependencyFiles,
  getOutputTeardownFiles,
  getSetupFiles,
  copyDirectory,
  tagsMatch
};