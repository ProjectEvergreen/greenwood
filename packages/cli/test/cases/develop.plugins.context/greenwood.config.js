// shared from another test
const myThemePackPlugin = require('../build.plugins.context/theme-pack-context-plugin');
const packageName = require('./package.json').name;
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

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

module.exports = {
  plugins: [
    ...myThemePackPlugin(),
    {
      type: 'resource',
      name: 'my-theme-pack:resource',
      provider: (compilation, options) => new MyThemePackDevelopmentResource(compilation, options)
    }
  ]
};