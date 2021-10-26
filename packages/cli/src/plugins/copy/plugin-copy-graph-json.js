import path from 'path';

const greenwoodPluginCopyGraphJson = [{
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

export { greenwoodPluginCopyGraphJson };