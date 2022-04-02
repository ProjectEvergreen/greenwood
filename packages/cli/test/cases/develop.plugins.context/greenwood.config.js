// shared from another test
import fs from 'fs';
import path from 'path';
import { myThemePackPlugin } from '../build.plugins.context/theme-pack-context-plugin.js';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { URL } from 'url';

const packageName = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8')).name;

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    return Promise.resolve(url.indexOf(`node_modules${path.sep}${packageName}`) >= 0);
  }

  async resolve(url) {
    return Promise.resolve(path.normalize(url).replace(`node_modules${path.sep}${packageName}${path.sep}dist`, 'fixtures'));
  }
}

export default {
  plugins: [
    ...myThemePackPlugin(),
    {
      type: 'resource',
      name: 'my-theme-pack:resource',
      provider: (compilation, options) => new MyThemePackDevelopmentResource(compilation, options)
    }
  ]
};