const crypto = require('crypto');
const fs = require('fs');
// TODO use node-html-parser
const htmlparser2 = require('htmlparser2');
const json = require('@rollup/plugin-json');
const multiInput = require('rollup-plugin-multi-input').default;
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const path = require('path');
const postcss = require('postcss');
const postcssConfig = require('./postcss.config');
const postcssImport = require('postcss-import');
const postcssRollup = require('rollup-plugin-postcss');
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
  const { userWorkspace, outputDir } = compilation.context;

  return {
    name: 'greenwood-html-plugin',
    load(id) {
      if (path.extname(id) === '.html') {
        return '';
      }
    },
    // TODO do this during load instead?
    async buildStart(options) {
      const mappedStyles = [];
      const mappedScripts = new Map();
      const that = this;
      // TODO handle deeper paths. e.g. ../../../
      const parser = new htmlparser2.Parser({
        onopentag(name, attribs) {
          if (name === 'script' && attribs.type === 'module' && attribs.src && !mappedScripts.get(attribs.src)) {
            const { src } = attribs;
                      
            // TODO avoid using src and set it to the value of rollup fileName
            // since user paths can still be the same file, e.g.  ../theme.css and ./theme.css are still the same file
            mappedScripts.set(src, true);

            const srcPath = src.replace('../', './');
            const source = fs.readFileSync(path.join(userWorkspace, srcPath), 'utf-8');
            
            that.emitFile({
              type: 'chunk',
              id: srcPath,
              name: srcPath.split('/')[srcPath.split('/').length - 1].replace('.js', ''),
              source
            });

            // console.debug('rollup emitFile (chunk)', srcPath);
          }

          if (name === 'link' && attribs.rel === 'stylesheet' && !mappedStyles[attribs.href]) {
            // console.debug('found a stylesheet!', attribs);
            let { href } = attribs;

            if (href.charAt(0) === '/') {
              href = href.slice(1);
            }

            // TODO handle auto expanding deeper paths
            const filePath = path.join(userWorkspace, href);
            const source = fs.readFileSync(filePath, 'utf-8');
            const to = `${outputDir}/${href}`;
            const hash = crypto.createHash('md5').update(source, 'utf8').digest('hex');
            const fileName = href
              .replace('.css', `.${hash.slice(0, 8)}.css`)
              .replace('../', '')
              .replace('./', '');

            if (!fs.existsSync(path.dirname(to))) {
              fs.mkdirSync(path.dirname(to), {
                recursive: true
              });
            }

            // TODO avoid using href and set it to the value of rollup fileName instead
            // since user paths can still be the same file, e.g.  ../theme.css and ./theme.css are still the same file
            mappedStyles[attribs.href] = {
              type: 'asset',
              fileName,
              name: href,
              source
            };

          }
        }
      });

      for (const input in options.input) {
        const inputHtml = options.input[input];
        const html = fs.readFileSync(inputHtml, 'utf-8');

        parser.write(html);
        parser.end();
        parser.reset();
      }
      
      // this is a giant work around because PostCSS and some plugins can only be run async
      // and so have to use with await but _outside_ sync code, like parser / rollup
      // https://github.com/cssnano/cssnano/issues/68
      // https://github.com/postcss/postcss/issues/595
      // TODO consider similar approach for emitting chunks?
      return Promise.all(Object.keys(mappedStyles).map(async (assetKey) => {
        const asset = mappedStyles[assetKey];
        const filePath = path.join(userWorkspace, asset.name);
        const userPostcssConfig = fs.existsSync(path.join(process.cwd(), 'postcss.config.js'))
          ? require(path.join(process.cwd(), 'postcss.config'))
          : {};
        const userPostcssPlugins = userPostcssConfig.plugins
          ? userPostcssConfig.plugins
          : [];
        
        const allPostcssPlugins = [
          ...userPostcssPlugins,
          ...postcssConfig.plugins
        ];
        
        const result = await postcss(allPostcssPlugins)
          .use(postcssImport())
          .process(asset.source, { from: filePath });

        asset.source = result.css;

        return new Promise((resolve, reject) => {
          try {
            that.emitFile(asset);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      }));
    },
    generateBundle(outputOptions, bundles) {
      const mappedBundles = new Map();
      // console.debug('rollup generateBundle bundles', Object.keys(bundles));
      
      // TODO looping over bundles twice is wildly inneficient, should refactor and safe references once
      for (const bundleId of Object.keys(bundles)) {
        const bundle = bundles[bundleId];

        // TODO handle (!) Generated empty chunks .greenwood/about, .greenwood/index
        if (bundle.isEntry && path.extname(bundle.facadeModuleId) === '.html') {
          const html = fs.readFileSync(bundle.facadeModuleId, 'utf-8');
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
                    // TODO no magic strings
                    if (innerBundleId.indexOf('.greenwood/') < 0 && !mappedBundles.get(innerBundleId)) {
                      // console.debug('NEW BUNDLE TO INJECT!');
                      newHtml = newHtml.replace(/<script type="module" src="(.*)"><\/script>/, `
                        <script type="module" src="/${innerBundleId}"></script>
                      `);
                      mappedBundles.set(innerBundleId, true);
                    }
                  }
                }
              }

              if (name === 'link' && attribs.rel === 'stylesheet') {
                for (const bundleId2 of Object.keys(bundles)) {
                  if (bundleId2.indexOf('.css') > 0) {
                    const bundle2 = bundles[bundleId2];
                    if (attribs.href.indexOf(bundle2.name) >= 0) {
                      newHtml = newHtml.replace(attribs.href, `/${bundle2.fileName}`);
                    }
                  }
                }
              }
            }
          });

          parser.write(html);
          parser.end();

          // TODO this seems hacky; hardcoded dirs :D
          bundle.fileName = bundle.facadeModuleId.replace('.greenwood', 'public');
          bundle.code = newHtml;
        }
      }
    }
  };
}

module.exports = getRollupConfig = async (compilation) => {
  
  const { scratchDir, outputDir } = compilation.context;

  return [{
    // TODO Avoid .greenwood/ directory, do everything in public/?
    input: `${scratchDir}/**/*.html`,
    // preserveEntrySignatures: false,
    output: { 
      dir: outputDir,
      entryFileNames: '[name].[hash].js',
      chunkFileNames: '[name].[hash].js'
    },
    onwarn: (messageObj) => {
      if ((/EMPTY_BUNDLE/).test(messageObj.code)) {
        return;
      } else {
        console.debug(messageObj.message);
      }
    },
    plugins: [
      nodeResolve(),
      greenwoodWorkspaceResolver(compilation),
      greenwoodHtmlPlugin(compilation),
      multiInput(),
      postcssRollup({
        extract: false,
        minimize: true,
        inject: false
      }),
      json(), // TODO bundle as part of import support / transforms API?
      terser()
    ]
  }];

};