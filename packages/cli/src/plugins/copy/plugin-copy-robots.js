import { checkResourceExists } from '../../lib/resource-utils.js';

const greenwoodPluginCopyRobots = [{
  type: 'copy',
  name: 'plugin-copy-robots',
  provider: async (compilation) => {
    const fileName = 'robots.txt';
    const { outputDir, userWorkspace } = compilation.context;
    const robotsPathUrl = new URL(`./${fileName}`, userWorkspace);
    const assets = [];

    if (await checkResourceExists(robotsPathUrl)) {
      assets.push({
        from: robotsPathUrl,
        to: new URL(`./${fileName}`, outputDir)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyRobots };