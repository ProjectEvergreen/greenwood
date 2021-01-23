const fs = require('fs');
const { ResourceInterface } = require('../../../src/lib/resource-interface');

class FooResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    
    this.extensions = ['.foo'];
    this.contentType = 'text/javascript';
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        let body = await fs.promises.readFile(url, 'utf-8');
        
        body = body.replace(/interface (.*){(.*)}/s, '');

        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  plugins: [{
    type: 'resource',
    name: 'plugin-foo',
    provider: (compilation, options) => new FooResource(compilation, options)
  }]
};