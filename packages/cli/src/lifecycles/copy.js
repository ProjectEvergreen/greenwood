import fs from "node:fs/promises";
import { checkResourceExists } from "../lib/resource-utils.js";
import { asyncForEach } from "../lib/async-utils.js";

async function rreaddir(dir, allFiles = []) {
  const files = (await fs.readdir(dir)).map((f) => new URL(`./${f}`, dir));

  allFiles.push(...files);

  await asyncForEach(
    files,
    async (f) =>
      (await fs.stat(f)).isDirectory() &&
      (await rreaddir(new URL(`file://${f.pathname}/`), allFiles)),
  );

  return allFiles;
}

async function copyFile(source, target, projectDirectory) {
  try {
    console.info(`copying file... ${source.pathname.replace(projectDirectory.pathname, "")}`);

    await fs.copyFile(source, target);
  } catch (error) {
    console.error("ERROR", error);
  }
}

async function copyDirectory(fromUrl, toUrl, projectDirectory) {
  try {
    console.info(`copying directory... ${fromUrl.pathname.replace(projectDirectory.pathname, "")}`);
    const files = await rreaddir(fromUrl);

    if (files.length > 0) {
      if (!(await checkResourceExists(toUrl))) {
        await fs.mkdir(toUrl, {
          recursive: true,
        });
      }

      await asyncForEach(files, async (fileUrl) => {
        const targetUrl = new URL(
          `file://${fileUrl.pathname.replace(fromUrl.pathname, toUrl.pathname)}`,
        );
        const isDirectory = (await fs.stat(fileUrl)).isDirectory();

        if (isDirectory && !(await checkResourceExists(targetUrl))) {
          await fs.mkdir(targetUrl, {
            recursive: true,
          });
        } else if (!isDirectory) {
          await copyFile(fileUrl, targetUrl, projectDirectory);
        }
      });
    }
  } catch (e) {
    console.error("ERROR", e);
  }
}

const copyAssets = async (compilation) => {
  const copyPlugins = compilation.config.plugins.filter((plugin) => plugin.type === "copy");
  const { projectDirectory } = compilation.context;

  await asyncForEach(copyPlugins, async (plugin) => {
    const locations = await plugin.provider(compilation);

    await asyncForEach(locations, async (location) => {
      const { from, to } = location;

      if (from.pathname.endsWith("/")) {
        await copyDirectory(from, to, projectDirectory);
      } else {
        await copyFile(from, to, projectDirectory);
      }
    });
  });
};

export { copyAssets };
