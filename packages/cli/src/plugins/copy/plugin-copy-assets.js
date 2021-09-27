const path = require('path');

module.exports = [{
  type: 'copy',
  name: 'plugin-copy-assets',
  provider: (compilation) => {
    const { context } = compilation;

    return [{
      from: path.join(context.userWorkspace, 'assets'),
      to: path.join(context.outputDir, 'assets')
    }];
  }
}];