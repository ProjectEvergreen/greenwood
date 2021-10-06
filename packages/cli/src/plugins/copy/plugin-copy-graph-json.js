const path = require('path');

module.exports = [{
  type: 'copy',
  name: 'plugin-copy-graph-json',
  provider: (compilation) => {
    const { context } = compilation;

    return [{
      from: path.join(context.scratchDir, 'graph.json'),
      to: path.join(context.outputDir, 'graph.json')
    }];
  }
}];