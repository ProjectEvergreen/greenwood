import { checkResourceExists } from '../../lib/resource-utils.js';

const greenwoodPluginCopyFavicon = [{
  type: 'copy',
  name: 'plugin-copy-favicon',
  provider: async (compilation) => {
    const fileName = 'favicon.ico';
    const { outputDir, userWorkspace } = compilation.context;
    const faviconPathUrl = new URL(`./${fileName}`, userWorkspace);
    const assets = [];

    if (await checkResourceExists(faviconPathUrl)) {
      assets.push({
        from: faviconPathUrl,
        to: new URL(`./${fileName}`, outputDir)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyFavicon };