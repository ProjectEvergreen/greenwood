/*
 * 
 * Detects and fully resolves import requests for CommonJS files in node_modules.
 *
 */
const fs = require('fs');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
const { parse } = require('cjs-module-lexer');
// const { build } = require('moduloze');

class ImportCommonJsResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldServe(url) {
    return new Promise(async (resolve, reject) => {
      let isCommonJs = false;

      if (path.extname(url) === '.js' && (/node_modules/).test(url) && url.indexOf('es-module-shims.js') < 0) {
        try {
          // console.debug(`check ${url} to see if it a common js module??????????`);
          // const { exports, reexports } = 
          let body = await fs.promises.readFile(url, 'utf-8');
          // Promise.resolve(parse(body));
          await parse(body);
          // const input = `${process.cwd()}/node_modules/**/*${path.basename(url)}`;
          isCommonJs = true;
          // console.debug('exports', exports);
          // console.debug('reexports', reexports);
          // console.debug('build', build);
          // module.exports = require('./lodash');
          // const code = require(url).default;
  
          // console.debug('require.default', code);
          // body = `
          //   ${body}

          //   export default _;
          // `;
          // console.debug('input to convert', input);
  
          // var srcPath = "./src/whatever.js";
          // var moduleContents = fs.readFileSync(srcPath,{ encoding: "utf-8" });
  
          // const config = {
          //   buildESM: true
          // };
  
          // // var depMap = {
          // //     "./src/whatever.js": "Whatever",
          // //     "./src/another.js": "Another"
          // // };
  
          // const esm = build(
          //   config,
          //   url,
          //   body,
          //   {}
          //   // depMap
          // );
  
          // const result = await transform({
          //   input
          // });
  
          // console.debug('CJS -> ESM ###############', esm);
          // body = esm.code;
          // console.debug('****************************************************');
          // Write to disk
          // for (const {fileName, text} of result.files) {
          //   writeFileSync(fileName, text);
          // }
        } catch (e) {
          const { message } = e;
          const isProbablyLexarErrorSoIgnore = message.indexOf('Unexpected import statement in CJS module.') >= 0 
            || message.indexOf('Unexpected export statement in CJS module.') >= 0;
          
          if (!isProbablyLexarErrorSoIgnore) {
            // we probably _shouldn't_ ignore this, so let's log it since we don't swollow everything
            console.error(e);
            reject(e);
          }
        }
      }
  
      return resolve(isCommonJs);
    });
  }

  async serve(url) {
    console.debug('plugin-import-commonjs for', url);
    return new Promise(async(resolve, reject) => {
      try {
        const fullUrl = path.extname(url) === '' ? `${url}.js` : url;
        const contents = await fs.promises.readFile(fullUrl, 'utf-8');

        // TODO how do I solve this!?
        const body = `
          ${contents}

          export default _;
        `;
        // require(url); // await fs.promises.readFile(fullUrl, 'utf-8');
        // console.debug('@@@@@@@ body', body);
        // handle exports['default'] = result;
        // if (body.indexOf('exports[\'default\'] = ') >= 0) {
        //   body = `
        //     let exports = {}\n
        //     ${body}
        //   `;
        //   body = body.replace('exports[\'default\'] = ', 'export default ');
        //   // console.debug('handled a weird edge case!!!', body);
        // }

        // const isESM = (/export /g).test(body) || (/import /g).test(body);
        // const isCommonJs = !isESM;
        // const isMjs = path.extname(url) === '.mjs';
        // console.debug(`common js module detection for ${url} ......`);
        // console.debug(`loading module => ${path.basename(url)}`);
        // console.debug('is likely an ESM module !!!!!!!!', isESM);
        // console.debug('is an mjs file ???????', isMjs);
        // console.debug('cjsMmoduleLexer parse', parse);
        // await init();
        // try {
        //   if (url.indexOf('es-module-shims.js') < 0) {
        //     const { exports, reexports } = await parse(body);
        //     // const input = `${process.cwd()}/node_modules/**/*${path.basename(url)}`;
        //     console.debug(`${url} is likely a common js module??????????`);
        //     console.debug('exports', exports);
        //     console.debug('reexports', reexports);
        //     console.debug('build', build);
        //     // module.exports = require('./lodash');
        //     const code = require(url).default;

        //     console.debug('require.default', code);
        //     body = `
        //       ${body}
        //       export default _;
        //     `;
        //     // console.debug('input to convert', input);

        //     // var srcPath = "./src/whatever.js";
        //     // var moduleContents = fs.readFileSync(srcPath,{ encoding: "utf-8" });

        //     // const config = {
        //     //   buildESM: true
        //     // };

        //     // // var depMap = {
        //     // //     "./src/whatever.js": "Whatever",
        //     // //     "./src/another.js": "Another"
        //     // // };

        //     // const esm = build(
        //     //   config,
        //     //   url,
        //     //   body,
        //     //   {}
        //     //   // depMap
        //     // );

        //     // const result = await transform({
        //     //   input
        //     // });

        //     // console.debug('CJS -> ESM ###############', esm);
        //     // body = esm.code;
        //     console.debug('****************************************************');
        //     // Write to disk
        //     // for (const {fileName, text} of result.files) {
        //     //   writeFileSync(fileName, text);
        //     // }
        //   }
        // } catch (e) {
        //   const { message } = e;
        //   const isProbablyLexarErrorSoIgnore = message.indexOf('Unexpected import statement in CJS module.') >= 0 
        //     || message.indexOf('Unexpected export statement in CJS module.') >= 0;
          
        //   if (!isProbablyLexarErrorSoIgnore) {
        //     // we probably _shouldn't_ ignore this, so let's log it since we don't swollow everything
        //     console.error(e);
        //   }
        // }

        resolve({
          body,
          contentType: 'text/javascript'
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = {
  type: 'resource',
  name: 'plugin-import-commonjs',
  provider: (compilation, options) => new ImportCommonJsResource(compilation, options)
};