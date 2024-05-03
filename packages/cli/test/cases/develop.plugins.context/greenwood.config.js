// shared from another test
import fs from 'fs/promises';
import { myThemePackPlugin } from '../build.plugins.context/theme-pack-context-plugin.js';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

const packageName = JSON.parse(await fs.readFile(new URL('./package.json', import.meta.url), 'utf-8')).name;

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  async shouldResolve(url) {
    return url.pathname.indexOf(`node_modules/${packageName}`) >= 0;
  }

  async resolve(url) {
    const themePackPathname = url.pathname.replace(`/node_modules/${packageName}/dist`, '/fixtures');
    const themePackUrl = new URL(`.${themePackPathname}`, import.meta.url);

    return new Request(themePackUrl);
  }
}

export default {
  plugins: [
    ...myThemePackPlugin({
      __isDevelopment: true
    }),
    {
      type: 'resource',
      name: 'my-theme-pack:resource',
      provider: (compilation, options) => new MyThemePackDevelopmentResource(compilation, options)
    }
  ]
};