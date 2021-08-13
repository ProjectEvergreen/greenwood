const myThemePack = require('./my-theme-pack');
const packageName = require('./package.json').name;
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    // eslint-disable-next-line no-underscore-dangle
    return Promise.resolve((process.env.__GWD_COMMAND__ === ' develop') && url.indexOf(`/node_modules/${packageName}/`) >= 0);
  }

  async resolve(url) {
    return Promise.resolve(this.getBareUrlPath(url).replace(`/node_modules/${packageName}/dist/`, path.join(process.cwd(), '/src/')));
  }
}

module.exports = {
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