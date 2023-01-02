const greenwoodPluginCopyGraphJson = [{
  type: 'copy',
  name: 'plugin-copy-graph-json',
  provider: (compilation) => {
    const { scratchDir, outputDir } = compilation.context;

    return [{
      from: new URL('./graph.json', scratchDir),
      to: new URL('./graph.json', outputDir)
    }];
  }
}];

export { greenwoodPluginCopyGraphJson };