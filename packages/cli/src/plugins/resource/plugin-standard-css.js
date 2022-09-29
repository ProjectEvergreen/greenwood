/*
 * 
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
import fs from 'fs';
import path from 'path';
import * as css from '@parcel/css';
import { ResourceInterface } from '../../lib/resource-interface.js';

class StandardCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/css';
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {  
        const css = await fs.promises.readFile(url, 'utf-8');

        resolve({
          body: css,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }

  async shouldOptimize(url) {
    const isValidCss = path.extname(url) === this.extensions[0] && this.compilation.config.optimization !== 'none';
    
    return Promise.resolve(isValidCss);
  }

  async optimize(url) {
    console.debug({ url });
    const { outputDir, userWorkspace } = this.compilation.context;

    return new Promise(async (resolve, reject) => {
      try {  
        // const { code } = css.transform({
        //   code: new TextEncoder().encode(body),
        //   minify: true
        // });
        const { code } = await css.bundleAsync({
          filename: url,
          minify: true,
          resolver: {
            resolve(specifier, from) {
              console.debug('resolve', path.dirname(url.replace(outputDir, userWorkspace)));
              console.debug({ from });
              console.debug({ specifier });
              if (specifier.indexOf('http') !== 0 && specifier.indexOf('//') !== 0) {
                return path.resolve(path.dirname(url.replace(outputDir, userWorkspace)), specifier);
              } else {
                return specifier;
              }
            }
          }
        });

        console.debug({ code });

        resolve(code);
      } catch (e) {
        reject(e);
      }
    });
  }
}

const greenwoodPluginStandardCss = {
  type: 'resource',
  name: 'plugin-standard-css',
  provider: (compilation, options) => new StandardCssResource(compilation, options)
};

export { greenwoodPluginStandardCss };