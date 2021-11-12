import fs from 'fs';
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
  try {
    console.info(`copying file... ${source.replace(`${process.cwd()}/`, '')}`);
    const rd = fs.createReadStream(source);
    const wr = fs.createWriteStream(target);

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

async function copyDirectory(from, to) {
  return new Promise(async(resolve, reject) => {
    try {
      console.info(`copying directory... ${from.replace(`${process.cwd()}/`, '')}`);
      const files = await rreaddir(from);

      if (files.length > 0) {
        if (!fs.existsSync(to)) {
          fs.mkdirSync(to);
        }
        await Promise.all(files.filter((asset) => {
          const target = asset.replace(from, to);
          const isDirectory = path.extname(target) === '';

          if (isDirectory && !fs.existsSync(target)) {
            fs.mkdirSync(target);
          } else if (!isDirectory) {
            return asset;
          }
        }).map((asset) => {
          const target = asset.replace(from, to);

          return copyFile(asset, target);
        }));
      }
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

const copyAssets = (compilation) => {

  return new Promise(async (resolve, reject) => {
    try {
      const copyPlugins = compilation.config.plugins.filter(plugin => plugin.type === 'copy');

      for (const plugin of copyPlugins) {
        const locations = plugin.provider(compilation);

        for (const location of locations) {
          const { from, to } = location;

          if (path.extname(from) === '') {
            // copy directory
            await copyDirectory(from, to);
          } else {
            // copy file
            await copyFile(from, to);
          }
        }
      }

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export { copyAssets };