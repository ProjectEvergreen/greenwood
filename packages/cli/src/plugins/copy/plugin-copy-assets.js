const fs = require('fs');
const path = require('path');

module.exports = [{
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