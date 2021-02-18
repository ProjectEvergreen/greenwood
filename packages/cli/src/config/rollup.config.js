const crypto = require('crypto');
const fs = require('fs');
// TODO use node-html-parser
const htmlparser2 = require('htmlparser2');
const json = require('@rollup/plugin-json');
const multiInput = require('rollup-plugin-multi-input').default;
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const path = require('path');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const replace = require('@rollup/plugin-replace');
const { terser } = require('rollup-plugin-terser');

async function getOptimizedSource(url, plugins, compilation) {
  const initSoure = fs.readFileSync(url, 'utf-8');
  let optimizedSource = await plugins.reduce(async (bodyPromise, resource) => {
    const body = await bodyPromise;
    const shouldOptimize = await resource.shouldOptimize(url, body);

    if (shouldOptimize) {
      const optimizedBody = await resource.optimize(url, body);
      
      return Promise.resolve(optimizedBody);
    } else {
      return Promise.resolve(body);
    }
  }, Promise.resolve(initSoure));

  // if no custom user optimization found, fallback to standard Greenwood default optimization
  if (optimizedSource === initSoure) {
    const standardPluginsPath = path.join(__dirname, '../', 'plugins/resource');
    const standardPlugins = (await fs.promises.readdir(standardPluginsPath))
      .filter(filename => filename.indexOf('plugin-standard') === 0)
      .map((filename) => {
        return require(`${standardPluginsPath}/${filename}`);
      }).map((plugin) => {
        return plugin.provider(compilation);
      });

    optimizedSource = await standardPlugins.reduce(async (sourcePromise, resource) => {
      const source = await sourcePromise;
      const shouldOptimize = await resource.shouldOptimize(url, source);
  
      if (shouldOptimize) {
        const defaultOptimizedSource = await resource.optimize(url, source);
        
        return Promise.resolve(defaultOptimizedSource);
      } else {
        return Promise.resolve(source);
      }
    }, Promise.resolve(optimizedSource));
  }

  return Promise.resolve(optimizedSource);
}

function greenwoodWorkspaceResolver (compilation) {
  const { userWorkspace } = compilation.context;

  return {
    name: 'greenwood-workspace-resolver',
    resolveId(source) {
      // TODO better way to handle relative paths?  happens in generateBundle too
      if ((source.indexOf('./') === 0 || source.indexOf('/') === 0) && path.extname(source) !== '.html' && fs.existsSync(path.join(userWorkspace, source))) {
        const resolvedPath = source.replace(source, path.join(userWorkspace, source));
        
        return resolvedPath;
      }

      return null;
    }
  };
}

// https://github.com/rollup/rollup/issues/2873
function greenwoodHtmlPlugin(compilation) {
  const { userWorkspace, outputDir } = compilation.context;
  const customResources = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  });

  return {
    name: 'greenwood-html-plugin',
    // tell Rollup how to handle HTML entry points 
    // and other custom user resource types like .ts, .gql, etc
    async load(id) {
      const extension = path.extname(id);
      
      switch (extension) {

        case '.html':
          return Promise.resolve('');
        default:
          customResources.filter((resource) => {
            const shouldServe = Promise.resolve(resource.shouldServe(id));

            if (shouldServe) {
              return resource;
            }
          });

          if (customResources.length) {
            const response = await customResources[0].serve(id);

            return Promise.resolve(response.body);
          }
          break;

      }
    },

    // crawl through all entry HTML files and emit JavaScript chunks and CSS assets along the way
    // for bundling with Rollup
    buildStart(options) {
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
          }

          if (name === 'link' && attribs.rel === 'stylesheet' && !mappedStyles[attribs.href]) {
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
            // since user paths can still be the same file, 
            // e.g. ../theme.css and ./theme.css are still the same file
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
      return Promise.all(Object.keys(mappedStyles).map(async (assetKey) => {
        const asset = mappedStyles[assetKey];
        const source = mappedStyles[assetKey].source;
        const result = await postcss()
          .use(postcssImport())
          .process(source, {
            from: path.join(userWorkspace, asset.name)
          });

        asset.source = result.css;

        return new Promise((resolve, reject) => {
          try {
            this.emitFile(asset);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      }));
    },

    // crawl through all entry HTML files and map bundled JavaScript and CSS filenames 
    // back to original <script> / <link> tags and update to their bundled filename in the HTML
    generateBundle(outputOptions, bundles) {
      const mappedBundles = new Map();
      
      for (const bundleId of Object.keys(bundles)) {
        const bundle = bundles[bundleId];

        // TODO handle (!) Generated empty chunks .greenwood/about, .greenwood/index
        if (bundle.isEntry && path.extname(bundle.facadeModuleId) === '.html') {
          const html = fs.readFileSync(bundle.facadeModuleId, 'utf-8');
          let newHtml = html;

          const parser = new htmlparser2.Parser({
            onopentag(name, attribs) {
              if (name === 'script' && attribs.type === 'module' && attribs.src) {
                for (const innerBundleId of Object.keys(bundles)) {
                  const facadeModuleId = bundles[innerBundleId].facadeModuleId;
                  const pathToMatch = attribs.src.replace('../', '').replace('./', '');

                  if (facadeModuleId && facadeModuleId.indexOf(pathToMatch) > 0) {
                    newHtml = newHtml.replace(attribs.src, `/${innerBundleId}`);
                  } else {
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
    },

    // use plugins to optimize final bundles for tools like terser, cssnano
    // TODO could do this in generate bundle, but that needs to be async first
    async writeBundle(outputOptions, bundles) {
      for (const bundleId of Object.keys(bundles)) {
        const bundle = bundles[bundleId];

        if (path.extname(bundle.facadeModuleId || bundle.name) !== '.html') {
          const sourcePath = `${outputDir}/${bundleId}`;
          const optimizedSource = await getOptimizedSource(sourcePath, customResources, compilation);

          await fs.promises.writeFile(sourcePath, optimizedSource);
        }
      }
    }
  };
}

module.exports = getRollupConfig = async (compilation) => {
  const { scratchDir, outputDir } = compilation.context;
  
  // TODO greenwood standard plugins, then "Greenwood" plugins, then user plugins
  const customRollupPlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'rollup';
  }).map((plugin) => {
    return plugin.provider(compilation);
  }).flat();
  
  return [{
    // TODO Avoid .greenwood/ directory, do everything in public/?
    input: `${scratchDir}**/*.html`,
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
      // TODO replace should come in via plugins?
      replace({ // https://github.com/rollup/rollup/issues/487#issuecomment-177596512
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      nodeResolve(), // TODO move to plugin
      greenwoodWorkspaceResolver(compilation),
      greenwoodHtmlPlugin(compilation),
      multiInput(),
      json(), // TODO bundle as part of import support / transforms API?
      terser(), // TODO extract to a plugin
      ...customRollupPlugins
    ]
  }];

};