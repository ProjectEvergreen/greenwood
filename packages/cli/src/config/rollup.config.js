/* eslint-disable max-depth, no-loop-func */
const fs = require('fs');
const htmlparser = require('node-html-parser');
const path = require('path');
const postcss = require('postcss');
const postcssImport = require('postcss-import');
const pluginNodeModules = require('../plugins/resource/plugin-node-modules');
const pluginResourceStandardJavaScript = require('../plugins/resource/plugin-standard-javascript');
const tokenSuffix = 'scratch';
const tokenNodeModules = 'node_modules';

const hashString = (queryKeysString) => {
  let h = 0;

  for (let i = 0; i < queryKeysString.length; i += 1) {
    h = Math.imul(31, h) + queryKeysString.charCodeAt(i) | 0; // eslint-disable-line no-bitwise
  }

  return Math.abs(h).toString();
};

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
        // assume that if it is an array, second item is a rollup plugin
        return plugin.length
          ? plugin[0].provider(compilation)
          : plugin.provider(compilation);
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
  const { optimization } = compilation.config;
  const isRemoteUrl = (url = undefined) => url && (url.indexOf('http') === 0 || url.indexOf('//') === 0);
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
      const importAsRegex = /\?type=(.*)/;

      // bit of a hack to get these two bugs to play well together
      // https://github.com/ProjectEvergreen/greenwood/issues/598
      // https://github.com/ProjectEvergreen/greenwood/issues/604
      if (importAsRegex.test(id)) {
        const match = id.match(importAsRegex);
        const importee = id
          .replace(match[0], '')
          .replace(/\\/g, '/');
        
        return `export {default} from '${importee}';`;
      }

      switch (extension) {

        case '.html':
          return Promise.resolve('');
        default:
          const resourceHandler = (await Promise.all(customResources.map(async (resource) => {
            const shouldServe = await resource.shouldServe(id);

            return shouldServe
              ? resource
              : null;
          }))).filter(resource => resource);

          if (resourceHandler.length) {
            const response = await resourceHandler[0].serve(id);

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
        try {
          const inputHtml = options.input[input];
          const html = fs.readFileSync(inputHtml, 'utf-8');
          const root = htmlparser.parse(html, {
            script: true,
            style: true
          });
          const headScripts = root.querySelectorAll('script');
          const headLinks = root.querySelectorAll('link');

          headScripts.forEach((scriptTag) => {
            const parsedAttributes = parseTagForAttributes(scriptTag);
     
            // handle <script type="module" src="some/path.js"></script>
            if (!isRemoteUrl(parsedAttributes.src) && parsedAttributes.type === 'module' && parsedAttributes.src && !mappedScripts.get(parsedAttributes.src)) {
              if (optimization === 'static' || parsedAttributes['data-gwd-opt'] === 'static') {
                // dont need to bundle / emit this one
              } else {
                const { src } = parsedAttributes;
                const absoluteSrc = `${path.normalize(src.replace(/\.\.\//g, '').replace('./', ''))}`;
                const basePath = absoluteSrc.indexOf(tokenNodeModules) >= 0
                  ? projectDirectory
                  : userWorkspace;
                const id = path.join(basePath, absoluteSrc);
                const source = fs.readFileSync(id, 'utf-8');
                
                mappedScripts.set(absoluteSrc, true);

                this.emitFile({
                  type: 'chunk',
                  id,
                  name: absoluteSrc.split(`${path.sep}`)[absoluteSrc.split(`${path.sep}`).length - 1].replace('.js', ''),
                  source
                });
              }
            }

            // handle <script type="module">/* some inline JavaScript code */</script>
            if (parsedAttributes.type === 'module' && scriptTag.rawText !== '') {
              const id = hashString(scriptTag.rawText);

              if (!mappedScripts.get(id)) {
                // using console.log avoids having rollup strip out our internal marker if we used a commnent
                const marker = `${id}-${tokenSuffix}`;
                const filename = `${marker}.js`;
                const source = `${scriptTag.rawText}console.log("${marker}");`.trim();

                fs.writeFileSync(path.join(scratchDir, filename), source);
                mappedScripts.set(id, true);

                this.emitFile({
                  type: 'chunk',
                  id: filename,
                  name: filename.replace('.js', ''),
                  source
                });
              }
            }
          });
      
          headLinks.forEach((linkTag) => {
            const parsedAttributes = parseTagForAttributes(linkTag);

            // handle <link rel="stylesheet" href="./some/path.css"></link>
            if (!isRemoteUrl(parsedAttributes.href) && parsedAttributes.rel === 'stylesheet' && !mappedStyles[parsedAttributes.href]) {
              let { href } = parsedAttributes;

              if (href.charAt(0) === '/') {
                href = href.slice(1);
              }

              const basePath = href.indexOf(tokenNodeModules) >= 0
                ? projectDirectory
                : userWorkspace;
              const absoluteHref = href.replace(/\.\.\//g, '').replace('./', '');
              const filePath = path.join(basePath, absoluteHref);
              const source = fs.readFileSync(filePath, 'utf-8');
              const to = `${outputDir}/${absoluteHref}`;
              const hash = hashString(source);
              const fileName = absoluteHref.replace('.css', `.${hash.slice(0, 8)}.css`);

              if (!fs.existsSync(path.dirname(to)) && href.indexOf(tokenNodeModules) < 0) {
                fs.mkdirSync(path.dirname(to), {
                  recursive: true
                });
              }

              mappedStyles[fileName] = {
                type: 'asset',
                fileName: fileName.indexOf(tokenNodeModules) >= 0
                  ? path.basename(fileName)
                  : fileName,
                name: href,
                source
              };
            }
          });
        } catch (e) {
          console.error(e);
        }
      }

      // this is a giant work around because PostCSS and some plugins can only be run async
      // and so have to use with await but _outside_ sync code, like parser / rollup
      // https://github.com/cssnano/cssnano/issues/68
      // https://github.com/postcss/postcss/issues/595
      Promise.all(Object.keys(mappedStyles).map(async (assetKey) => {
        const asset = mappedStyles[assetKey];
        const source = mappedStyles[assetKey].source;
        const basePath = asset.name.indexOf(tokenNodeModules) >= 0
          ? projectDirectory
          : userWorkspace;
        const result = await postcss()
          .use(postcssImport())
          .process(source, {
            from: path.join(basePath, asset.name.replace(/\.\.\//g, ''))
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

    // crawl through all entry HTML files and map Rollup bundled JavaScript and CSS filenames
    // back to their original <script> / <link> tags, and update the HTML to their new bundled filenames
    generateBundle(outputOptions, bundles) {      
      for (const bundleId of Object.keys(bundles)) {
        try {
          const bundle = bundles[bundleId];

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
              if (!isRemoteUrl(parsedAttributes.src) && parsedAttributes.type === 'module' && parsedAttributes.src) {
                for (const innerBundleId of Object.keys(bundles)) {
                  const { src } = parsedAttributes;
                  const facadeModuleId = bundles[innerBundleId].facadeModuleId
                    ? bundles[innerBundleId].facadeModuleId.replace(/\\/g, '/')
                    : bundles[innerBundleId].facadeModuleId;
                  let pathToMatch = src.replace(/\.\.\//g, '').replace('./', '');

                  /*
                   * this is an odd issue related to symlinking in our Greenwood monorepo when building the website
                   * and managing packages that we create as "virtaul" modules, like for the mpa router
                   *
                   * ex. import @greenwood/router/router.js -> /node_modules/@greenwood/cli/src/lib/router.js
                   *
                   * when running our tests, which better emulates a real user
                   * facadeModuleId will be in node_modules, which is like how it would be for a user:
                   * /node_modules/@greenwood/cli/src/lib/router.js
                   *
                   * however, when building our website, where symlinking points back to our packages/ directory
                   * facadeModuleId will look like this:
                   * /<workspace>/greenwood/packages/cli/src/lib/router.js
                   *
                   * so we need to massage pathToMatch a bit for Rollup for our internal development
                   * pathToMatch (before): /node_modules/@greenwood/cli/src/lib/router.js
                   * pathToMatch (after): /cli/src/lib/router.js
                   */
                  if (facadeModuleId && facadeModuleId.indexOf(tokenNodeModules) < 0 && fs.existsSync(path.join(projectDirectory, pathToMatch))) {
                    pathToMatch = pathToMatch.replace(/\/node_modules\/@greenwood\//, '/');
                  }

                  if (facadeModuleId && facadeModuleId.indexOf(pathToMatch) > 0) {
                    const newSrc = `/${innerBundleId}`;
                    
                    newHtml = newHtml.replace(src, newSrc);
                    
                    if (!parsedAttributes['data-gwd-opt'] && optimization === 'default') {
                      newHtml = newHtml.replace('<head>', `
                        <head>
                        <link rel="modulepreload" href="${newSrc}" as="script">
                      `);
                    }
                  } else if ((parsedAttributes['data-gwd-opt'] === 'static' || optimization === 'static') && newHtml.indexOf(pathToMatch) > 0) {
                    newHtml = newHtml.replace(scriptTag, '');
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
                      const newHref = `/${bundle2.fileName}`;
                      
                      newHtml = newHtml.replace(href, newHref);

                      if (!parsedAttributes['data-gwd-opt'] && (optimization !== 'none' && optimization !== 'inline')) {
                        newHtml = newHtml.replace('<head>', `
                          <head>
                          <link rel="preload" href="${newHref}" as="style" crossorigin="anonymous"></link>
                        `);
                      }
                    }
                  }
                }
              }
            });

            bundle.fileName = bundle.facadeModuleId.replace('.greenwood', 'public');
            bundle.code = newHtml;
          }
        } catch (e) {
          console.error('ERROR', e);
        }
      }
    },

    // crawl through all entry HTML files and map bundled JavaScript and CSS filenames
    // back to their original _inline_ <script> / <link> tags
    async writeBundle(outputOptions, bundles) {
      const scratchFiles = {};

      for (const bundleId of Object.keys(bundles)) {
        const bundle = bundles[bundleId];

        if (bundle.isEntry && path.extname(bundle.facadeModuleId) === '.html') {
          const htmlPath = bundle.facadeModuleId.replace('.greenwood', 'public');
          let html = fs.readFileSync(htmlPath, 'utf-8');
          const root = htmlparser.parse(html, {
            script: true,
            style: true
          });
          const headScripts = root.querySelectorAll('script');
          const headLinks = root.querySelectorAll('link');

          headScripts.forEach((scriptTag) => {
            const parsedAttributes = parseTagForAttributes(scriptTag);
            const isScriptSrcTag = parsedAttributes.src && parsedAttributes.type === 'module';

            // handle <script type="module" src="..."></script>
            if ((parsedAttributes['data-gwd-opt'] === 'inline' || optimization === 'inline') && isScriptSrcTag && !isRemoteUrl(parsedAttributes.src)) {
              const src = parsedAttributes.src;
              const basePath = src.indexOf(tokenNodeModules) >= 0 
                ? process.cwd()
                : outputDir;
              const outputPath = path.join(basePath, src);
              const js = fs.readFileSync(outputPath, 'utf-8');
              scratchFiles[src] = true;

              html = html.replace(`<script ${scriptTag.rawAttrs}></script>`, `
                <script type="module">
                  ${js}
                </script>
              `);
            }

            // handle <script type="module"> /* inline code */ </script>
            if (parsedAttributes.type === 'module' && !parsedAttributes.src) {
              const id = hashString(scriptTag.rawText);
              const markerExp = `console.log\\("[0-9]+-${tokenSuffix}"\\)`;
              const markerRegex = new RegExp(markerExp);

              for (const innerBundleId of Object.keys(bundles)) {
                if (innerBundleId.indexOf(`-${tokenSuffix}`) > 0 && path.extname(innerBundleId) === '.js') {
                  const bundledSource = fs.readFileSync(path.join(outputDir, innerBundleId), 'utf-8')
                    .replace(/\.\//g, '/'); // force absolute paths
                  
                  if (markerRegex.test(bundledSource)) {
                    const marker = bundledSource.match(new RegExp(`[0-9]+-${tokenSuffix}`))[0].split('-')[0];
                    
                    if (id === marker) {
                      const cleaned = bundledSource
                        .replace(new RegExp(`,${markerExp};\n`), '')
                        .replace(new RegExp(`${markerExp};\n`), '');

                      html = html.replace(scriptTag.rawText, cleaned);
                      scratchFiles[innerBundleId] = true;
                    }
                  }
                }
              }
            }
          });

          headLinks
            .forEach((linkTag) => {
              const parsedAttributes = parseTagForAttributes(linkTag);
              const isLocalLinkTag = parsedAttributes.rel === 'stylesheet'
                && !isRemoteUrl(parsedAttributes.href);
              
              if (isLocalLinkTag && (parsedAttributes['data-gwd-opt'] === 'inline' || optimization === 'inline')) {
                const href = parsedAttributes.href;
                const outputPath = path.join(outputDir, href);
                const css = fs.readFileSync(outputPath, 'utf-8');
                scratchFiles[href] = true;

                html = html.replace(`<link ${linkTag.rawAttrs}>`, `
                  <style>
                    ${css}
                  </style>
                `);
              }
            });
          // mark each HTML's sourcemap file (generated by Rollup) to be cleaned up
          // would be nice if we could just prevent Rollup from generating sourcemaps for just our input files in the first place (GFI)
          // https://github.com/ProjectEvergreen/greenwood/issues/659
          scratchFiles[`${htmlPath.replace(outputDir, '')}.map`] = true;
          html = html.replace('//# sourceMappingURL=index.html.map', '');

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
  const inputs = compilation.graph.map((page) => {
    return path.normalize(`${scratchDir}${page.route}index.html`);
  });
  const greenwoodRollupPlugins = [
    ...pluginNodeModules[1].provider(compilation),
    ...pluginResourceStandardJavaScript[1].provider(compilation),
    greenwoodWorkspaceResolver(compilation),
    greenwoodHtmlPlugin(compilation)
  ];
  const customRollupPlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'rollup';
  }).map((plugin) => {
    return plugin.provider(compilation);
  }).flat();

  return [{
    input: inputs,
    output: { 
      dir: outputDir,
      entryFileNames: '[name].[hash].js',
      chunkFileNames: '[name].[hash].js',
      sourcemap: true
    },
    onwarn: (errorObj) => {
      const { code, message } = errorObj;

      switch (code) {

        case 'EMPTY_BUNDLE':
          // since we use .html files as entry points
          // we "ignore" them as bundles (see greenwoodHtmlPlugin#load hook)
          // but don't want the logs to be noisy, so this suppresses those warnings
          break;
        case 'UNRESOLVED_IMPORT':
          // this could be a legit warning for users, but...
          if (process.env.__GWD_ROLLUP_MODE__ === 'strict') { // eslint-disable-line no-underscore-dangle
            // if we see it happening in our tests / website build
            // treat it as an error for us since it usually is...
            // https://github.com/ProjectEvergreen/greenwood/issues/620
            throw new Error(message);
          } else {
            // we should still log it so the user knows at least
            console.debug(message);
          }
          break;
        default:
          // otherwise, log all warnings from rollup
          console.debug(message);

      }
    },
    plugins: [
      ...greenwoodRollupPlugins,
      ...customRollupPlugins
    ]
  }];

};