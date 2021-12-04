// shared from another test
import fs from 'fs';
import { myThemePackPlugin } from '../build.plugins.context/theme-pack-context-plugin.js';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { URL } from 'url';

const packageName = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8')).name;

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    return Promise.resolve(url.indexOf(`/node_modules/${packageName}/`) >= 0);
  }

  async resolve(url) {
    return Promise.resolve(url.replace(`/node_modules/${packageName}/dist/`, path.join(process.cwd(), '/fixtures/')));
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