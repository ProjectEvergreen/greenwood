import fs from 'fs';
import path from 'path';

const greenwoodPluginCopyFavicon = [{
  type: 'copy',
  name: 'plugin-copy-favicon',
  provider: (compilation) => {
    const fileName = 'favicon.ico';
    const { context } = compilation;
    const robotsPath = path.join(context.userWorkspace, fileName);
    const assets = [];

    if (fs.existsSync(robotsPath)) {
      assets.push({
        from: robotsPath,
        to: path.join(context.outputDir, fileName)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyFavicon };