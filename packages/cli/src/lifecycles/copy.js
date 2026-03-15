import fs from "node:fs/promises";
import { asyncForEach } from "../lib/async-utils.js";

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
    await fs.cp(fromUrl, toUrl, { recursive: true });
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
