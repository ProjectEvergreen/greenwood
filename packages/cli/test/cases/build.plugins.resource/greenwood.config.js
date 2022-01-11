import fs from 'fs';
import { ResourceInterface } from '../../../src/lib/resource-interface.js';

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

export default {
  prerender: true,
  plugins: [{
    type: 'resource',
    name: 'plugin-foo',
    provider: (compilation, options) => new FooResource(compilation, options)
  }]
};