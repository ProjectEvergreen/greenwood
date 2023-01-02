import fs from 'fs';

const greenwoodPluginCopyRobots = [{
  type: 'copy',
  name: 'plugin-copy-robots',
  provider: (compilation) => {
    const fileName = 'robots.txt';
    const { outputDir, userWorkspace } = compilation.context;
    const robotsPathUrl = new URL(`./${fileName}`, userWorkspace);
    const assets = [];

    if (fs.existsSync(robotsPathUrl.pathname)) {
      assets.push({
        from: robotsPathUrl,
        to: new URL(`./${fileName}`, outputDir)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyRobots };