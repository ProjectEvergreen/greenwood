import fs from "node:fs/promises";

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

  // copies run in series so that when two of them share a destination, the last one registered wins
  for (const plugin of copyPlugins) {
    const locations = await plugin.provider(compilation);

    for (const location of locations) {
      const { from, to } = location;

      if (from.pathname.endsWith("/")) {
        await copyDirectory(from, to, projectDirectory);
      } else {
        await copyFile(from, to, projectDirectory);
      }
    }
  }
};

export { copyAssets };
