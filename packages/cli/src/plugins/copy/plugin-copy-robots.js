import fs from 'fs/promises';

const greenwoodPluginCopyRobots = [{
  type: 'copy',
  name: 'plugin-copy-robots',
  provider: async (compilation) => {
    const fileName = 'robots.txt';
    const { outputDir, userWorkspace } = compilation.context;
    const robotsPathUrl = new URL(`./${fileName}`, userWorkspace);
    const assets = [];

    try {
      await fs.access(robotsPathUrl);

      assets.push({
        from: robotsPathUrl,
        to: new URL(`./${fileName}`, outputDir)
      });
    } catch (e) {

    }

    return assets;
  }
}];

export { greenwoodPluginCopyRobots };