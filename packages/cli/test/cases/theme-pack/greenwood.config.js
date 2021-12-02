import fs from 'fs';
import { myThemePack } from './my-theme-pack.js';
import path from 'path';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';
import { fileURLToPath, URL } from 'url';

const packageName = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8')).name;

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    // eslint-disable-next-line no-underscore-dangle
    return Promise.resolve(process.env.__GWD_COMMAND__ === 'develop' && url.indexOf(`/node_modules/${packageName}/`) >= 0);
  }

  async resolve(url) {
    return Promise.resolve(this.getBareUrlPath(url).replace(`/node_modules/${packageName}/dist/`, path.join(process.cwd(), '/src/')));
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