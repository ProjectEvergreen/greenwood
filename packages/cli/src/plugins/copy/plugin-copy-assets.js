import fs from 'fs';
import path from 'path';

const greenwoodPluginCopyAssets = [{
  type: 'copy',
  name: 'plugin-copy-assets',
  provider: (compilation) => {
    const { context } = compilation;
    const fromAssetsDir = path.join(context.userWorkspace, 'assets');
    const assets = [];

    if (fs.existsSync(fromAssetsDir)) {
      assets.push({
        from: fromAssetsDir,
        to: path.join(context.outputDir, 'assets')
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyAssets };