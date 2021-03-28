const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

async function rreaddir (dir, allFiles = []) {
  const files = (await fsPromises.readdir(dir)).map(f => path.join(dir, f));
  
  allFiles.push(...files);
  
  await Promise.all(files.map(async f => (
    await fsPromises.stat(f)).isDirectory() && rreaddir(f, allFiles
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

module.exports = copyAssets = (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const { context } = compilation;

      if (fs.existsSync(`${context.userWorkspace}/assets`)) {
        console.info('copying assets/ directory...');
        const assetPaths = await rreaddir(`${context.userWorkspace}/assets`);
      
        if (assetPaths.length > 0) {
          if (!fs.existsSync(`${context.outputDir}/assets`)) {
            fs.mkdirSync(`${context.outputDir}/assets`);
          }

          await Promise.all(assetPaths.filter((asset) => {
            const target = asset.replace(context.userWorkspace, context.outputDir);
            const isDirectory = path.extname(target) === '';
            
            if (isDirectory && !fs.existsSync(target)) {
              fs.mkdirSync(target);
            } else if (!isDirectory) {
              return asset;
            }
          }).map((asset) => {
            const target = asset.replace(context.userWorkspace, context.outputDir);

            return copyFile(asset, target);
          }));
        }
      }

      console.info('copying graph.json...');
      await copyFile(`${context.scratchDir}graph.json`, `${context.outputDir}/graph.json`);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};