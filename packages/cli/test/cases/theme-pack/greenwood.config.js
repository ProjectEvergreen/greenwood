import fs from 'fs';
import path from 'path';
import { myThemePack } from './my-theme-pack.js';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { URL } from 'url';

const packageName = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8')).name;

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    // eslint-disable-next-line no-underscore-dangle
    return Promise.resolve(process.env.__GWD_COMMAND__ === 'develop' && url.indexOf(`node_modules${path.sep}${packageName}/`) >= 0);
  }

  async resolve(url) {
    return Promise.resolve(path.normalize(this.getBareUrlPath(url)).replace(`node_modules${path.sep}${packageName}${path.sep}dist`, 'src'));
  }
}

export default {
  plugins: [
    ...myThemePack({
      __isDevelopment: true
    }),
    {
      type: 'resource',
      name: `${packageName}:resource`,
      provider: (compilation, options) => new MyThemePackDevelopmentResource(compilation, options)
    }
  ]
};