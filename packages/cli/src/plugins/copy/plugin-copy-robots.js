import fs from 'fs';
import path from 'path';

const greenwoodPluginCopyRobots = [{
  type: 'copy',
  name: 'plugin-copy-robots',
  provider: (compilation) => {
    const fileName = 'robots.txt';
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

export { greenwoodPluginCopyRobots };