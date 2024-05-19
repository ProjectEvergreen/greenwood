import fs from 'fs/promises';

const packageJson = JSON.parse(await fs.readFile(new URL('./package.json', import.meta.url), 'utf-8'));
const myThemePackPlugin = (options = {}) => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: () => {
    const { name } = packageJson;

    const layoutLocation = options.__isDevelopment // eslint-disable-line no-underscore-dangle
      ? new URL('./fixtures/my-layouts/', import.meta.url)
      : new URL(`./node_modules/${name}/dist/my-layouts/`, import.meta.url);

    return {
      layouts: [
        layoutLocation
      ]
    };
  }
}];

export {
  myThemePackPlugin
};