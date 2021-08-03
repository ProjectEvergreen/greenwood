const path = require('path');
const packageJson = require('./package.json');

module.exports = (options = {}) => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: (compilation) => {
    const baseDistDir = `node_modules/${packageJson.name}/dist`;
    const { projectDirectory } = compilation.context;
    const templateLocation = options.__isDevelopment // eslint-disable-line no-underscore-dangle
      ? path.join(process.cwd(), 'fixtures/layouts')
      : path.join(projectDirectory, `${baseDistDir}/layouts`);

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];