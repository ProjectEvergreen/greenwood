import path from 'path';

export default {
  plugins: [{
    type: 'copy',
    name: 'plugin-copy-prismjs',
    provider: (compilation) => {
      const { projectDirectory, outputDir } = compilation.context;
      const prismThemeDir = 'node_modules/prismjs/themes';
      const from = path.join(projectDirectory, prismThemeDir);
      const to = path.join(outputDir, prismThemeDir);

      return [{
        from,
        to
      }];
    }
  }]
};