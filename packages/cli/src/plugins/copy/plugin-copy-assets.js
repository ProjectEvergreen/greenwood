import fs from 'fs';

const greenwoodPluginCopyAssets = [{
  type: 'copy',
  name: 'plugin-copy-assets',
  provider: (compilation) => {
    const { outputDir, userWorkspace } = compilation.context;
    const fromAssetsDirUrl = new URL('./assets/', userWorkspace);
    const assets = [];

    if (fs.existsSync(fromAssetsDirUrl.pathname)) {
      assets.push({
        from: fromAssetsDirUrl,
        to: new URL('./assets/', outputDir)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyAssets };