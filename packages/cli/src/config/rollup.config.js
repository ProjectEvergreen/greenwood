const Buffer = require('buffer').Buffer;
const fs = require('fs');
const htmlparser = require('node-html-parser');
const json = require('@rollup/plugin-json');
const multiInput = require('rollup-plugin-multi-input').default;
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const path = require('path');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const replace = require('@rollup/plugin-replace');
const { terser } = require('rollup-plugin-terser');

const tokenSuffix = 'scratch';
// const tokenNodeModules = 'node_modules/';

const parseTagForAttributes = (tag) => {
  return tag.rawAttrs.split(' ').map((attribute) => {
    if (attribute.indexOf('=') > 0) {
      const attributePieces = attribute.split('=');
      return {
        [attributePieces[0]]: attributePieces[1].replace(/"/g, '').replace(/'/g, '')
      };
    } else {
      return undefined;
    }
  }).filter(attribute => attribute)
    .reduce((accum, attribute) => {
      return Object.assign(accum, {
        ...attribute
      });
    }, {});
};

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
  const { userWorkspace, scratchDir } = compilation.context;

  return {
    name: 'greenwood-workspace-resolver',
    resolveId(source) {
      // TODO better way to handle relative paths?  happens in generateBundle too
      if ((source.indexOf('./') === 0 || source.indexOf('/') === 0) && path.extname(source) !== '.html' && fs.existsSync(path.join(userWorkspace, source))) {        
        return source.replace(source, path.join(userWorkspace, source));
      }

      // handle inline script / style bundling
      if (source.indexOf(`-${tokenSuffix}`) > 0 && fs.existsSync(path.join(scratchDir, source))) {        
        return source.replace(source, path.join(scratchDir, source));
      }

      return null;
    }
  };
}

// https://github.com/rollup/rollup/issues/2873
function greenwoodHtmlPlugin(compilation) {
  const { projectDirectory, userWorkspace, outputDir, scratchDir } = compilation.context;
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

      for (const input in options.input) {
        const inputHtml = options.input[input];
        const html = fs.readFileSync(inputHtml, 'utf-8');
        const root = htmlparser.parse(html, {
          script: true,
          style: true
        });
        const headScripts = root.querySelectorAll('script');
        const headLinks = root.querySelectorAll('link');
        // const headStyles = root.querySelectorAll('style');
    
        // TODO handle deeper paths. e.g. ../../../
        headScripts.forEach((scriptTag) => {
          const parsedAttributes = parseTagForAttributes(scriptTag);

          // handle <script type="module" src="some/path.js"></script>
          if (parsedAttributes.type === 'module' && parsedAttributes.src && !mappedScripts.get(parsedAttributes.src)) {
            const { src } = parsedAttributes;

            // TODO avoid using src and set it to the value of rollup fileName
            // since user paths can still be the same file, e.g.  ../theme.css and ./theme.css are still the same file
            mappedScripts.set(src, true);

            const srcPath = src.replace('../', './');
            const basePath = srcPath.indexOf('node_modules/') >= 0
              ? projectDirectory
              : userWorkspace;
            const source = fs.readFileSync(path.join(basePath, srcPath), 'utf-8');

            this.emitFile({
              type: 'chunk',
              id: srcPath.replace('/node_modules', path.join(projectDirectory, 'node_modules')),
              name: srcPath.split('/')[srcPath.split('/').length - 1].replace('.js', ''),
              source
            });
          }

          // handle <script type="module">/* some inline JavaScript code */</script>
          if (parsedAttributes.type === 'module' && scriptTag.rawText !== '') {
            const id = Buffer.from(scriptTag.rawText).toString('base64').slice(0, 8).toLowerCase();

            if (!mappedScripts.get(id)) {
              const filename = `${id}-${tokenSuffix}.js`;
              const source = `
                // ${filename}
                ${scriptTag.rawText}
              `.trim();

              // have to write a file for rollup?
              fs.writeFileSync(path.join(scratchDir, filename), source);

              // TODO avoid using src and set it to the value of rollup fileName
              // since user paths can still be the same file, e.g.  ../theme.css and ./theme.css are still the same file
              mappedScripts.set(id, true);

              this.emitFile({
                type: 'chunk',
                id: filename,
                name: filename.replace('.js', ''),
                source
              });
            }
          }

          // TODO handle <script type="module" src="@bare-path/specifier"></script>
        });
    
        headLinks.forEach((linkTag) => {
          const parsedAttributes = parseTagForAttributes(linkTag);

          // handle <link rel="stylesheet" src="./some/path.css"></link>
          if (parsedAttributes.rel === 'stylesheet' && !mappedStyles[parsedAttributes.href]) {
            let { href } = parsedAttributes;

            if (href.charAt(0) === '/') {
              href = href.slice(1);
            }

            // TODO handle auto expanding deeper paths
            const basePath = href.indexOf('node_modules/') >= 0
              ? projectDirectory
              : userWorkspace;
            const filePath = path.join(basePath, href.replace('../', './'));
            const source = fs.readFileSync(filePath, 'utf-8');
            const to = `${outputDir}/${href}`;
            const hash = Buffer.from(source).toString('base64').toLowerCase();
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
            // e.g.  ../theme.css and ./theme.css are still the same file
            mappedStyles[parsedAttributes.href] = {
              type: 'asset',
              fileName: fileName.indexOf('node_modules/') >= 0
                ? path.basename(fileName)
                : fileName,
              name: href,
              source
            };
          }
    
          // TODO handle <style>/* some inline CSS */</style> - as part of generateBundle?
        });

        // TODO handle <style>/* some inline CSS code */</style>
        // how to avoid Puppeteer styles?
        // headStyles.map((styleTag) => {
        //   const cssSource = styleTag.childNodes.map(node => node.rawText).join();
        //   const id = Buffer.from(cssSource).toString('base64').slice(0, 8).toLowerCase();
        //   const filename = `${id}-${tokenSuffix}.css`;
          
        //   if (cssSource !== '' && !mappedStyles[filename]) {
        //     const fileName = `${id}-${tokenSuffix}.css`;
        //     const source = `
        //       /*! ${filename} */
        //       ${cssSource}
        //     `; // .trim();

        //     // TODO avoid using src and set it to the value of rollup fileName
        //     // since user paths can still be the same file, e.g.  ../theme.css and ./theme.css are still the same file
        //     mappedStyles[filename] = {
        //       type: 'asset',
        //       fileName,
        //       name: id,
        //       source
        //     };
        //   }
        // });
      }

      // this is a giant work around because PostCSS and some plugins can only be run async
      // and so have to use with await but _outside_ sync code, like parser / rollup
      // https://github.com/cssnano/cssnano/issues/68
      // https://github.com/postcss/postcss/issues/595
      Promise.all(Object.keys(mappedStyles).map(async (assetKey) => {
        const asset = mappedStyles[assetKey];
        const source = mappedStyles[assetKey].source;
        const basePath = asset.name.indexOf('node_modules/') >= 0
          ? projectDirectory
          : userWorkspace;
        const result = await postcss()
          .use(postcssImport())
          .process(source, {
            from: path.join(basePath, asset.name)
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
      for (const bundleId of Object.keys(bundles)) {
        const bundle = bundles[bundleId];

        // TODO handle (!) Generated empty chunks .greenwood/about, .greenwood/index
        if (bundle.isEntry && path.extname(bundle.facadeModuleId) === '.html') {
          const html = fs.readFileSync(bundle.facadeModuleId, 'utf-8');
          const root = htmlparser.parse(html, {
            script: true,
            style: true
          });
          const headScripts = root.querySelectorAll('script');
          const headLinks = root.querySelectorAll('link');
          let newHtml = html;

          headScripts.forEach((scriptTag) => {
            const parsedAttributes = parseTagForAttributes(scriptTag);
  
            // handle <script type="module" src="some/path.js"></script>
            if (parsedAttributes.type === 'module' && parsedAttributes.src) {
              for (const innerBundleId of Object.keys(bundles)) {
                const { src } = parsedAttributes;
                const facadeModuleId = bundles[innerBundleId].facadeModuleId;
                const pathToMatch = src.replace('../', '').replace('./', '');

                if (facadeModuleId && facadeModuleId.indexOf(pathToMatch) > 0) {
                  newHtml = newHtml.replace(src, `/${innerBundleId}`);
                }
              }
            }
          });
      
          headLinks.forEach((linkTag) => {
            const parsedAttributes = parseTagForAttributes(linkTag);
            const { href } = parsedAttributes;
  
            // handle <link rel="stylesheet" src="/some/path.css"></link>
            if (parsedAttributes.rel === 'stylesheet') {
              for (const bundleId2 of Object.keys(bundles)) {
                if (bundleId2.indexOf('.css') > 0) {
                  const bundle2 = bundles[bundleId2];
                  if (href.indexOf(bundle2.name) >= 0) {
                    newHtml = newHtml.replace(href, `/${bundle2.fileName}`);
                  }
                }
              }
            }
          });

          // TODO this seems hacky; hardcoded dirs :D
          bundle.fileName = bundle.facadeModuleId.replace('.greenwood', 'public');
          bundle.code = newHtml;
        }
      }
    },

    async writeBundle(outputOptions, bundles) {
      const scratchFiles = {};

      for (const bundleId of Object.keys(bundles)) {
        const bundle = bundles[bundleId];

        if (bundle.isEntry && path.extname(bundle.facadeModuleId) === '.html') {
          // TODO this seems hacky; hardcoded dirs :D
          const htmlPath = bundle.facadeModuleId.replace('.greenwood', 'public');
          let html = fs.readFileSync(htmlPath, 'utf-8');
          const root = htmlparser.parse(html, {
            script: true,
            style: true
          });
          const headScripts = root.querySelectorAll('script');
          const headStyles = root.querySelectorAll('style');

          headScripts.forEach((scriptTag) => {
            const parsedAttributes = parseTagForAttributes(scriptTag);
            
            // handle <script type="module"> /* inline code */ </script>
            if (parsedAttributes.type === 'module' && scriptTag.rawText !== '') {
              for (const innerBundleId of Object.keys(bundles)) {
                if (innerBundleId.indexOf(`-${tokenSuffix}`) > 0 && path.extname(innerBundleId) === '.js') {           
                  const bundledSource = fs.readFileSync(path.join(outputDir, innerBundleId), 'utf-8')
                    .replace(/\.\//g, '/'); // force absolute paths
                  html = html.replace(scriptTag.rawText, bundledSource);

                  scratchFiles[innerBundleId] = true;
                }
              }
            }
          });

          // TODO - support optimizzing <style> /* some code */ </style> and not confuse with puppeteer styles
          headStyles.forEach((styleTag) => {
            const cssSource = styleTag.childNodes.map(node => node.rawText).join();
            
            if (cssSource !== '') {
              for (const innerBundleId of Object.keys(bundles)) {
                if (innerBundleId.indexOf(`-${tokenSuffix}`) > 0 && path.extname(innerBundleId) === '.css') {             
                  // console.debug('!!!!!!!! found an inline style tag, swap out with optimized from disk');
                  // const bundledSource = fs.readFileSync(path.join(outputDir, innerBundleId), 'utf-8');
                  // html = html.replace(cssSource, bundledSource);
                  // console.debug('****************');
                  // console.debug('bundledSource', bundledSource);
                  // console.debug('css source', cssSource);
                  // if()
                  // console.debug('newHtml', newHtml);
                  // console.debug('****************');
                }
              }
            }
          });

          await fs.promises.writeFile(htmlPath, html);
        } else {
          const sourcePath = `${outputDir}/${bundleId}`;
          const optimizedSource = await getOptimizedSource(sourcePath, customResources, compilation);
  
          await fs.promises.writeFile(sourcePath, optimizedSource);
        }
      }

      // cleanup any scratch files
      return Promise.all(Object.keys(scratchFiles).map(async (file) => {
        return await fs.promises.unlink(path.join(outputDir, file));
      }));
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