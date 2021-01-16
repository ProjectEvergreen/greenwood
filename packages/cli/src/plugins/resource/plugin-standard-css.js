/*
 * 
 * Manages web standard resource related operations for CSS.
 * This is a Greenwood default plugin.
 *
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const { ResourceInterface } = require('../../lib/resource-interface');

class StandardCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/css';
  }

  async serve(url, header) {
    return new Promise(async (resolve, reject) => {
      try {
        const destHeader = header['sec-fetch-dest'];        
        let css = await fs.promises.readFile(url, 'utf-8');
        let body = '';
        let contentType = '';

        // TODO try and use context.projectDirectory
        if (fs.existsSync(path.join(process.cwd(), 'postcss.config.js'))) {
          const userPostcssConfig = require(`${process.cwd()}/postcss.config`);
          const userPostcssPlugins = userPostcssConfig.plugins || [];
          
          if (userPostcssPlugins.length > 0) {
            const result = await postcss(userPostcssPlugins)
              .process(css, { from: url });

            css = result.css;
          }
        }

        // <style> tag used
        if (destHeader === 'style') {
          contentType = this.contentType;
          body = css;
        } else if (destHeader === 'empty') {
          // assume JS import being being used
          contentType = 'text/javascript';
          // TODO line breaks are bad for fetch, need to return CSS string all on one line
          body = `const css = "${css.replace(/\r?\n|\r/g, ' ')}";\nexport default css;`;
        }

        resolve({
          body,
          contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-standard-css',
  provider: (compilation, options) => new StandardCssResource(compilation, options)
};