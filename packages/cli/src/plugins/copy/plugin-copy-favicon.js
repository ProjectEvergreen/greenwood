import fs from 'fs';

const greenwoodPluginCopyFavicon = [{
  type: 'copy',
  name: 'plugin-copy-favicon',
  provider: (compilation) => {
    const fileName = 'favicon.ico';
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

export { greenwoodPluginCopyFavicon };