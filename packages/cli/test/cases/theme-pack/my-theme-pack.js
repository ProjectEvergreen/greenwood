const packageJson = require('./package.json');
const path = require('path');

module.exports = (options = {}) => [{
  type: 'context',
  name: `${packageJson.name}:context`,
  provider: (compilation) => {
    const templateLocation = options.__isDevelopment // eslint-disable-line no-underscore-dangle
      ? path.join(compilation.context.userWorkspace, 'layouts')
      : path.join(__dirname, 'dist/layouts');

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];