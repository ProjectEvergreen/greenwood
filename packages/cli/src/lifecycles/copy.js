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
async function copyFile(source, target, projectDirectory) {
  try {
    console.info(`copying file... ${source.pathname.replace(projectDirectory.pathname, '')}`);
    const rd = fs.createReadStream(source.pathname);
    const wr = fs.createWriteStream(target.pathname);

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

async function copyDirectory(fromUrl, toUrl, projectDirectory) {
  try {
    console.info(`copying directory... ${fromUrl.pathname.replace(projectDirectory.pathname, '')}`);
    const files = await rreaddir(fromUrl.pathname);

    if (files.length > 0) {
      if (!fs.existsSync(toUrl.pathname)) {
        fs.mkdirSync(toUrl.pathname, {
          recursive: true
        });
      }
      await Promise.all(files.filter((filePath) => {
        const target = filePath.replace(fromUrl.pathname, toUrl.pathname);
        const isDirectory = fs.lstatSync(filePath).isDirectory();

        if (isDirectory && !fs.existsSync(target)) {
          fs.mkdirSync(target);
        } else if (!isDirectory) {
          return filePath;
        }
      }).map((filePath) => {
        const sourceUrl = new URL(`file://${filePath}`);
        const targetUrl = new URL(`file://${filePath.replace(fromUrl.pathname, toUrl.pathname)}`);

        return copyFile(sourceUrl, targetUrl, projectDirectory);
      }));
    }
  } catch (e) {
    console.error('ERROR', e);
  }
}

const copyAssets = async (compilation) => {
  const copyPlugins = compilation.config.plugins.filter(plugin => plugin.type === 'copy');
  const { projectDirectory } = compilation.context;

  for (const plugin of copyPlugins) {
    const locations = await plugin.provider(compilation);

    for (const location of locations) {
      const { from, to } = location;

      if (from.pathname.endsWith('/')) {
        await copyDirectory(from, to, projectDirectory);
      } else {
        await copyFile(from, to, projectDirectory);
      }
    }
  }
};

export { copyAssets };