import fs from 'fs';
import path from 'path';
import { URL } from 'url';

const packageJson = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8'));
const myThemePack = (options = {}) => [{
  type: 'context',
  name: `${packageJson.name}:context`,
  provider: (compilation) => {
    const templateLocation = options.__isDevelopment // eslint-disable-line no-underscore-dangle
      ? path.join(compilation.context.userWorkspace, 'layouts')
      : path.join(path.dirname(new URL('', import.meta.url).pathname), 'dist/layouts');

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];

export {
  myThemePack
};