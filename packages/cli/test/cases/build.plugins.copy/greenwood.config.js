export default {
  plugins: [{
    type: 'copy',
    name: 'plugin-copy-prismjs',
    provider: (compilation) => {
      const { projectDirectory, outputDir } = compilation.context;
      const prismThemeDir = '/node_modules/prismjs/themes/';
      const from = new URL(`.${prismThemeDir}`, projectDirectory);
      const to = new URL(`.${prismThemeDir}`, outputDir);

      return [{ from, to }];
    }
  }]
};