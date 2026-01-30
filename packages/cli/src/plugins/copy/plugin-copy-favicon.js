import { checkResourceExists } from "../../lib/resource-utils.js";

const greenwoodPluginCopyFavicon = [
  {
    type: "copy",
    name: "plugin-copy-favicon",
    provider: async (compilation) => {
      const fileNameIco = "favicon.ico";
      const fileNameSvg = "favicon.svg";
      const { outputDir, userWorkspace } = compilation.context;
      const faviconPathIcoUrl = new URL(`./${fileNameIco}`, userWorkspace);
      const faviconPathSvgUrl = new URL(`./${fileNameSvg}`, userWorkspace);
      const assets = [];

      if (await checkResourceExists(faviconPathIcoUrl)) {
        assets.push({
          from: faviconPathIcoUrl,
          to: new URL(`./${fileNameIco}`, outputDir),
        });
      } else if (await checkResourceExists(faviconPathSvgUrl)) {
        assets.push({
          from: faviconPathSvgUrl,
          to: new URL(`./${fileNameSvg}`, outputDir),
        });
      }

      return assets;
    },
  },
];

export { greenwoodPluginCopyFavicon };
