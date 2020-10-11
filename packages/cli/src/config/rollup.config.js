const fs = require('fs');
const fsPromises = require('fs').promises;
// TODO use node-html-parser
const htmlparser2 = require('htmlparser2');
const json = require('@rollup/plugin-json');
const multiInput = require('rollup-plugin-multi-input').default;
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const path = require('path');
const postcss = require('rollup-plugin-postcss');
const { terser } = require('rollup-plugin-terser');

function greenwoodWorkspaceResolver (compilation) {
  const { userWorkspace } = compilation.context;

  return {
    name: 'greenwood-workspace-resolver', // this name will show up in warnings and errors
    resolveId(source) {
      // TODO better way to handle relative paths?  happens in generateBundle too
      if ((source.indexOf('./') === 0 || source.indexOf('/') === 0) && path.extname(source) !== '.html' && fs.existsSync(path.join(userWorkspace, source))) {
        const resolvedPath = source.replace(source, path.join(userWorkspace, source));
        // console.debug('resolve THIS sauce to workspace directory, returning ', resolvedPath);
        
        return resolvedPath; // this signals that rollup should not ask other plugins or check the file system to find this id
      }

      return null; // other ids should be handled as usually
    }
  };
}

// https://github.com/rollup/rollup/issues/2873
function greenwoodHtmlPlugin(compilation) {
  const { userWorkspace } = compilation.context;

  return {
    name: 'greenwood-html-plugin',
    load(id) {
      // console.debug('load id', id);
      if (path.extname(id) === '.html') {
        return '';
      }
    },
    // TODO do this during load instead?
    async buildStart(options) {
      // TODO dont emit duplicate scripts, e.g. use a Map()
      const that = this;
      const parser = new htmlparser2.Parser({
        onopentag(name, attribs) {
          if (name === 'script' && attribs.type === 'module' && attribs.src) {
            // TODO handle deeper paths
            const srcPath = attribs.src.replace('../', './');
            const scriptSrc = fs.readFileSync(path.join(userWorkspace, srcPath), 'utf-8');

            that.emitFile({
              type: 'chunk',
              id: srcPath,
              name: srcPath.split('/')[srcPath.split('/').length - 1].replace('.js', ''),
              source: scriptSrc
            });

            // console.debug('emitFile for script => ', srcPath);
          }
        }
      });

      for (const input in options.input) {
        const inputHtml = options.input[input];
        const html = await fsPromises.readFile(inputHtml, 'utf-8');

        parser.write(html);
        parser.end();
        parser.reset();
      }
    },
    async generateBundle(outputOptions, bundles) {
      const mappedBundles = new Map();

      // TODO looping over bundles twice is wildly inneficient, should refactor and safe references once
      for (const bundleId of Object.keys(bundles)) {
        const bundle = bundles[bundleId];

        // TODO handle (!) Generated empty chunks .greenwood/about, .greenwood/index
        if (bundle.isEntry && path.extname(bundle.facadeModuleId) === '.html') {
          const html = await fsPromises.readFile(bundle.facadeModuleId, 'utf-8');
          let newHtml = html;

          const parser = new htmlparser2.Parser({
            onopentag(name, attribs) {
              if (name === 'script' && attribs.type === 'module' && attribs.src) {
                // console.debug('bundle', bundle);
                // console.debug(bundles[innerBundleId])
                for (const innerBundleId of Object.keys(bundles)) {
                  const facadeModuleId = bundles[innerBundleId].facadeModuleId;
                  const pathToMatch = attribs.src.replace('../', '').replace('./', '');

                  if (facadeModuleId && facadeModuleId.indexOf(pathToMatch) > 0) {
                    // console.debug('MATCH FOUND!!!!!!!');
                    newHtml = newHtml.replace(attribs.src, `/${innerBundleId}`);
                  } else {
                    // console.debug('NO MATCH?????', innerBundleId);
                    // TODO better testing
                    // TODO magic string
                    if(innerBundleId.indexOf('.greenwood/') < 0 && !mappedBundles.get(innerBundleId)){
                      // console.debug('NEW BUNDLE TO INJECT!');
                      newHtml = newHtml.replace(/<script type="module" src="(.*)"><\/script>/, `
                        <script type="module" src="/${innerBundleId}"></script>
                      `);
                      mappedBundles.set(innerBundleId, true);
                    }
                  }
                }
              }
            }
          });

          parser.write(html);
          parser.end();

          // TODO this seems hacky; hardcoded dirs :D
          bundle.fileName = bundle.facadeModuleId.replace('.greenwood', './public');
          bundle.code = newHtml;
        }
      }
    }
  };
}

module.exports = getRollupConfig = async (compilation) => {
  
  const { scratchDir, outputDir } = compilation.context;;

  return [{
    // TODO Avoid .greenwood/ directory, do everything in public/?
    input: `${scratchDir}/**/*.html`,
    output: { 
      dir: outputDir,
      entryFileNames: '[name].[hash].js',
      chunkFileNames: '[name].[hash].js'
    },
    plugins: [
      // ignoreImport({
      //   include: ['**/*.css'],
      //   // extensions: ['.css']
      // }),
      nodeResolve(),
      greenwoodWorkspaceResolver(compilation),
      greenwoodHtmlPlugin(compilation),
      multiInput(),
      postcss({
        extract: false,
        minimize: true
      }),
      json(), // TODO bundle as part of import support?
      terser()
    ]
  }];

};

// }, {
//   input: `${workspaceDirectory}/**/*.css`, // TODO emits a www/styles.js file?
//   output: { // TODO CSS filename hashing / cache busting - https://github.com/egoist/rollup-plugin-postcss/pull/226
//     dir: outputDirectory
//   },
//   plugins: [
//     multiInput(),
//     postcss({
//       extract: true,
//       minimize: true
//     })
//   ]