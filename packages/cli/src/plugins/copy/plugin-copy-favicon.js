import fs from 'fs/promises';

const greenwoodPluginCopyFavicon = [{
  type: 'copy',
  name: 'plugin-copy-favicon',
  provider: async (compilation) => {
    const fileName = 'favicon.ico';
    const { outputDir, userWorkspace } = compilation.context;
    const robotsPathUrl = new URL(`./${fileName}`, userWorkspace);
    const assets = [];

    try {
      await fs.access(robotsPathUrl);

      assets.push({
        from: robotsPathUrl,
        to: new URL(`./${fileName}`, outputDir)
      });
    } catch (error) {
      console.log('copy favion', { error });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyFavicon };