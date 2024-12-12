import { derivePackageRoot, resolveBareSpecifier } from '@greenwood/cli/src/lib/walker-package-ranger.js';

export default {
  plugins: [{
    type: 'copy',
    name: 'plugin-copy-prismjs',
    provider: (compilation) => {
      const { outputDir } = compilation.context;
      const prismSpecifier = 'prismjs';
      const prismResolved = resolveBareSpecifier(prismSpecifier);
      const prismRoot = derivePackageRoot(prismResolved);

      const from = new URL('./themes/', prismRoot);
      const to = new URL('./node_modules/prismjs/themes/', outputDir);

      return [{ from, to }];
    }
  }]
};