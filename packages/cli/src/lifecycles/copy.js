import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";

function warnAndTrackDestination(destination, pluginName, pluginNamesByDestination) {
  if (pluginNamesByDestination.has(destination.href)) {
    console.warn(
      `Duplicate copy destination "${destination.href}" from plugins "${pluginNamesByDestination.get(destination.href)}" and "${pluginName}". The last registered copy wins.`,
    );
  }

  pluginNamesByDestination.set(destination.href, pluginName);
}

async function copyDestination(
  { from, to },
  pluginName,
  projectDirectory,
  pluginNamesByDestination,
) {
  try {
    const isDirectory = from.pathname.endsWith("/");
    const source = from.pathname.replace(projectDirectory.pathname, "");

    console.info(`copying ${isDirectory ? "directory" : "file"}... ${source}`);

    if (isDirectory) {
      await fs.cp(from, to, {
        recursive: true,
        filter: async (source, target) => {
          if (!(await fs.lstat(source)).isDirectory()) {
            warnAndTrackDestination(pathToFileURL(target), pluginName, pluginNamesByDestination);
          }

          return true;
        },
      });
    } else {
      warnAndTrackDestination(to, pluginName, pluginNamesByDestination);
      await fs.copyFile(from, to);
    }
  } catch (error) {
    console.error("ERROR", error);
  }
}

const copyAssets = async (compilation) => {
  const copyPlugins = compilation.config.plugins.filter((plugin) => plugin.type === "copy");
  const { projectDirectory } = compilation.context;
  const pluginNamesByDestination = new Map();

  // Copies can write to the same destination, so both loops must stay sequential to
  // avoid corrupting files and ensure the last registered copy wins.
  // https://github.com/ProjectEvergreen/greenwood/issues/1764
  for (const plugin of copyPlugins) {
    const locations = await plugin.provider(compilation);

    for (const location of locations) {
      await copyDestination(location, plugin.name, projectDirectory, pluginNamesByDestination);
    }
  }
};

export { copyAssets };
