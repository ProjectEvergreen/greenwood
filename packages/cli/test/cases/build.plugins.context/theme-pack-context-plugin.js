const path = require('path');

module.exports = (options = {}) => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: (compilation) => {
    const { context } = compilation;
    const templateLocation = options.__isDevelopment // eslint-disable-line no-underscore-dangle
      ? path.join(process.cwd(), 'fixtures/layouts')
      : path.join(context.projectDirectory, 'node_modules/my-theme-pack/dist/layouts');

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];