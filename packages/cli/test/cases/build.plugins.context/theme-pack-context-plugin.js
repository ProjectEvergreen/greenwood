import fs from 'fs/promises';

const packageJson = JSON.parse(await fs.readFile(new URL('./package.json', import.meta.url), 'utf-8'));
const myThemePackPlugin = (options = {}) => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: () => {
    const { name } = packageJson;

    const templateLocation = options.__isDevelopment
      ? new URL('./fixtures/layouts/', import.meta.url)
      : new URL(`./node_modules/${name}/dist/layouts/`, import.meta.url);

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];

export {
  myThemePackPlugin
};