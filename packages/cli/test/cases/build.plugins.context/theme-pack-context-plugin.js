const path = require('path');

module.exports = (options = {}) => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: (compilation) => {
    console.debug('options', options);

    return {
      templates: [
        path.join(compilation.context.projectDirectory, 'node_modules/my-theme-pack/dist/layouts')
      ]
    };
  }
}];