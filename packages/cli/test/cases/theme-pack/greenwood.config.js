import fs from 'fs/promises';
import { myThemePack } from './my-theme-pack.js';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

const packageName = JSON.parse(await fs.readFile(new URL('./package.json', import.meta.url), 'utf-8')).name;

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    // eslint-disable-next-line no-underscore-dangle
    return process.env.__GWD_COMMAND__ === 'develop' && url.pathname.startsWith(`/node_modules/${packageName}/`);
  }

  async resolve(url) {
    const themePackUrl = url.pathname.replace(`/node_modules/${packageName}/dist`, 'src');

    return new Request(`${this.compilation.context.projectDirectory}${themePackUrl}`); 
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