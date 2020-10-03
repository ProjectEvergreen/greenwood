import fs from 'fs';
import { promises as fsPromises } from 'fs';
// TODO use node-html-parser
import htmlparser2 from 'htmlparser2';
import json from '@rollup/plugin-json';
import multiInput from 'rollup-plugin-multi-input';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import path from 'path';
import postcss from 'rollup-plugin-postcss';
import { terser } from 'rollup-plugin-terser';
import ignoreImport from 'rollup-plugin-ignore-import';

const scratchDirectory = path.join(process.cwd(), '.greenwood');
const workspaceDirectory = path.join(process.cwd(), 'www');
const outputDirectory = path.join(process.cwd(), 'public');

function greenwoodWorkspaceResolver () {
  return {
    name: 'greenwood-workspace-resolver', // this name will show up in warnings and errors
    resolveId(source) {
      // TODO better way to handle relative paths?  happens in generateBundle too
      if ((source.indexOf('./') === 0 || source.indexOf('/') === 0) && path.extname(source) !== '.html' && fs.existsSync(path.join(workspaceDirectory, source))) {
        const resolvedPath = source.replace(source, path.join(workspaceDirectory, source));
        // console.debug('resolve THIS sauce to workspace directory, returning ', resolvedPath);
        
        return resolvedPath; // this signals that rollup should not ask other plugins or check the file system to find this id
      }

      return null; // other ids should be handled as usually
    }
  };
}

// https://github.com/rollup/rollup/issues/2873
function greenwoodHtmlPlugin() {

  return {
    name: 'greenwood-html-plugin',
    load(id) {
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
            const scriptSrc = fs.readFileSync(path.join(workspaceDirectory, srcPath), 'utf-8');

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

          // TODO this seems hacky :D
          bundle.fileName = bundle.facadeModuleId.replace('.greenwood', './public');
          bundle.code = newHtml;
        }
      }
    }
  };
}

export default [{
  // TODO Avoid .greenwood/ directory, do everything in public/?
  input: `${scratchDirectory}/**/*.html`,
  output: { 
    dir: outputDirectory,
    entryFileNames: '[name].[hash].js',
    chunkFileNames: '[name].[hash].js'
  },
  plugins: [
    // ignoreImport({
    //   include: ['**/*.css'],
    //   // extensions: ['.css']
    // }),
    nodeResolve(),
    greenwoodWorkspaceResolver(),
    greenwoodHtmlPlugin(),
    multiInput(),
    postcss({
      extract: false,
      minimize: true
    }),
    json(), // TODO bundle as part of import support?
    terser()
  ]
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
}];