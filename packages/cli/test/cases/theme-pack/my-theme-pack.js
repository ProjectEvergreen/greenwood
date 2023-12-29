import fs from 'fs/promises';

const packageJson = JSON.parse(await fs.readFile(new URL('./package.json', import.meta.url), 'utf-8'));
const myThemePack = (options = {}) => [{
  type: 'context',
  name: `${packageJson.name}:context`,
  provider: (compilation) => {
    const layoutLocation = options.__isDevelopment // eslint-disable-line no-underscore-dangle
      ? new URL('./my-layouts/', compilation.context.userWorkspace)
      : new URL('./dist/my-layouts/', import.meta.url);

    return {
      layouts: [
        layoutLocation
      ]
    };
  }
}];

export {
  myThemePack
};