const packageName = require('./package.json').name;
const path = require('path');
const myThemePackPlugin = require('./theme-pack-context-plugin');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');
const { spawnSync } = require('child_process');
const ls = spawnSync('npm', ['ls', packageName]);

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    return Promise.resolve(url.indexOf('/node_modules/my-theme-pack/') >= 0);
  }

  async resolve(url) {
    return url.replace('/node_modules/my-theme-pack/dist/', path.join(process.cwd(), '/fixtures/'));
  }
}

module.exports = {
  plugins: [
    ...myThemePackPlugin({
      __isDevelopment: ls.stdout.toString().indexOf('(empty)') >= 0
    }), {
      type: 'resource',
      name: 'my-theme-pack:resource',
      provider: (compilation, options) => new MyThemePackDevelopmentResource(compilation, options)
    }
  ]
};