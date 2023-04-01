import { checkResourceExists } from '../../lib/resource-utils.js';

const greenwoodPluginCopyUserTemplates = [{
  type: 'copy',
  name: 'plugin-user-templates',
  provider: async (compilation) => {
    const { outputDir, userTemplatesDir } = compilation.context;
    const assets = [];

    if (await checkResourceExists(userTemplatesDir)) {
      assets.push({
        from: userTemplatesDir,
        to: new URL('./_templates/', outputDir)
      });
    }

    return assets;
  }
}];

export { greenwoodPluginCopyUserTemplates };