import fs from 'fs/promises';

const greenwoodPluginCopyAssets = [{
  type: 'copy',
  name: 'plugin-copy-assets',
  provider: async (compilation) => {
    const { outputDir, userWorkspace } = compilation.context;
    const fromAssetsDirUrl = new URL('./assets/', userWorkspace);
    const assets = [];

    try {
      await fs.access(fromAssetsDirUrl);

      assets.push({
        from: fromAssetsDirUrl,
        to: new URL('./assets/', outputDir)
      });
    } catch (e) {

    }

    return assets;
  }
}];

export { greenwoodPluginCopyAssets };