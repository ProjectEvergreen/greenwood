const greenwoodPluginCopyManifestJson = [{
  type: 'copy',
  name: 'plugin-copy-manifest-json',
  provider: (compilation) => {
    const { scratchDir, outputDir } = compilation.context;

    return [{
      from: new URL('./manifest.json', scratchDir),
      to: new URL('./manifest.json', outputDir)
    }];
  }
}];

export { greenwoodPluginCopyManifestJson };