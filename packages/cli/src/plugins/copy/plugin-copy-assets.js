import { checkResourceExists } from '../../lib/resource-utils.js';

const greenwoodPluginCopyAssets = [{
  type: 'copy',
  name: 'plugin-copy-assets',
  provider: async (compilation) => {
    const { outputDir, userWorkspace } = compilation.context;
    const fromAssetsDirUrl = new URL('./assets/', userWorkspace);
    const assets = [];

    if (await checkResourceExists(fromAssetsDirUrl)) {
      assets.push({
        from: fromAssetsDirUrl,
        to: new URL('./assets/', outputDir)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyAssets };