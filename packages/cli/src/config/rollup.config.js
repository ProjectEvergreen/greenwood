/* eslint-disable complexity, max-depth */
import fs from 'fs';
import path from 'path';
import { checkResourceExists, normalizePathnameForWindows } from '../lib/resource-utils.js';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import * as walk from 'acorn-walk';

// https://github.com/rollup/rollup/issues/2121
// would be nice to get rid of this
function cleanRollupId(id) {
  return id.replace('\x00', '').replace('?commonjs-proxy', '');
}

// ConstructableStylesheets, JSON Modules
const externalizedResources = ['css', 'json'];

function greenwoodResourceLoader (compilation, browser = false) {
  const { importAttributes } = compilation.config?.polyfills;
  const resourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  });

  return {
    name: 'greenwood-resource-loader',
    async resolveId(id, importer) {
      const normalizedId = cleanRollupId(id);
      const { userWorkspace } = compilation.context;

      // check for non bare paths and resolve them to the user's workspace
      // or Greenwood's scratch dir, like when bundling inline <script> tags
      if (normalizedId.startsWith('.')) {
        const importerUrl = new URL(normalizedId, `file://${importer}`);
        const extension = importerUrl.pathname.split('.').pop();
        // if we are polyfilling import attributes for the browser we will want Rollup to bundles these as JS files
        // instead of externalizing as their native content-type
        const shouldPolyfill = browser && (importAttributes || []).includes(extension);
        const external = !shouldPolyfill && externalizedResources.includes(extension) && browser && !importerUrl.searchParams.has('type');
        const isUserWorkspaceUrl = importerUrl.pathname.startsWith(userWorkspace.pathname);
        const prefix = normalizedId.startsWith('..') ? './' : '';
        // if its not in the users workspace, we clean up the dot-dots and check that against the user's workspace
        const resolvedUrl = isUserWorkspaceUrl
          ? importerUrl
          : new URL(`${prefix}${normalizedId.replace(/\.\.\//g, '')}`, userWorkspace);

        if (await checkResourceExists(resolvedUrl)) {
          return {
            id: normalizePathnameForWindows(resolvedUrl),
            external
          };
        }
      }
    },
    async load(id) {
      let idUrl = new URL(`file://${cleanRollupId(id)}`);
      const { pathname } = idUrl;
      const extension = pathname.split('.').pop();
      const headers = {
        'Accept': 'text/javascript'
      };

      // filter first for any bare specifiers
      if (await checkResourceExists(idUrl) && extension !== 'js') {
        for (const plugin of resourcePlugins) {
          if (plugin.shouldResolve && await plugin.shouldResolve(idUrl)) {
            idUrl = new URL((await plugin.resolve(idUrl)).url);
          }
        }

        const request = new Request(idUrl, {
          headers
        });
        let response = new Response('');

        for (const plugin of resourcePlugins) {
          if (plugin.shouldServe && await plugin.shouldServe(idUrl, request)) {
            response = await plugin.serve(idUrl, request);
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldPreIntercept && await plugin.shouldPreIntercept(idUrl, request, response.clone())) {
            response = await plugin.preIntercept(idUrl, request, response.clone());
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldIntercept && await plugin.shouldIntercept(idUrl, request, response.clone())) {
            response = await plugin.intercept(idUrl, request, response.clone());
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldOptimize && await plugin.shouldOptimize(idUrl, response.clone())) {
            response = await plugin.optimize(idUrl, response.clone());
          }
        }

        return await response.text();
      }
    }
  };
}

function greenwoodSyncPageResourceBundlesPlugin(compilation) {
  return {
    name: 'greenwood-sync-page-resource-bundles-plugin',
    async writeBundle(outputOptions, bundles) {
      const { outputDir } = compilation.context;

      for (const resource of compilation.resources.values()) {
        const resourceKey = normalizePathnameForWindows(resource.sourcePathURL);

        for (const bundle in bundles) {
          let facadeModuleId = (bundles[bundle].facadeModuleId || '').replace(/\\/g, '/');
          /*
           * this is an odd issue related to symlinking in our Greenwood monorepo when building the website
           * and managing packages that we create as "virtual" modules, like for the mpa router
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
           * so we need to massage facadeModuleId a bit for Rollup for our internal development
           * pathToMatch (before): /node_modules/@greenwood/cli/src/lib/router.js
           * pathToMatch (after): /cli/src/lib/router.js
           */
          if (resourceKey?.indexOf('/node_modules/@greenwood/cli') > 0 && facadeModuleId?.indexOf('/packages/cli') > 0) {
            if (await checkResourceExists(new URL(`file://${facadeModuleId}`))) {
              facadeModuleId = facadeModuleId.replace('/packages/cli', '/node_modules/@greenwood/cli');
            }
          }

          if (resourceKey === facadeModuleId) {
            const { fileName } = bundles[bundle];
            const { rawAttributes, contents } = resource;
            const noop = rawAttributes && rawAttributes.indexOf('data-gwd-opt="none"') >= 0 || compilation.config.optimization === 'none';
            const outputPath = new URL(`./${fileName}`, outputDir);

            compilation.resources.set(resource.sourcePathURL.pathname, {
              ...compilation.resources.get(resource.sourcePathURL.pathname),
              optimizedFileName: fileName,
              optimizedFileContents: await fs.promises.readFile(outputPath, 'utf-8'),
              contents
            });

            if (noop) {
              await fs.promises.writeFile(outputPath, contents);
            }
          }
        }
      }
    }
  };
}

function greenwoodSyncSsrEntryPointsOutputPaths(compilation) {
  return {
    name: 'greenwood-sync-ssr-pages-entry-point-output-paths',
    generateBundle(options, bundle) {
      const { basePath } = compilation.config;
      const { scratchDir } = compilation.context;

      // map rollup bundle names back to original SSR pages for syncing input <> output bundle names
      Object.keys(bundle).forEach((key) => {
        if (bundle[key].exports?.find(exp => exp === 'handler')) {
          const ext = bundle[key].facadeModuleId.split('.').pop();
          // account for windows pathname shenanigans by "casting" facadeModuleId to a URL first
          const route = new URL(`file://${bundle[key].facadeModuleId}`).pathname.replace(scratchDir.pathname, `${basePath}/`).replace(`.${ext}`, '/').replace('/index/', '/');

          compilation.graph.forEach((page, idx) => {
            if (page.route === route) {
              compilation.graph[idx].outputPath = key;
            }
          });
        }
      });
    }
  };
}

function greenwoodSyncApiRoutesOutputPath(compilation) {
  return {
    name: 'greenwood-sync-api-routes-output-paths',
    generateBundle(options, bundle) {
      const { basePath } = compilation.config;
      const { apisDir } = compilation.context;

      // map rollup bundle names back to original SSR pages for syncing input <> output bundle names
      Object.keys(bundle).forEach((key) => {
        if (bundle[key].exports?.find(exp => exp === 'handler')) {
          const ext = bundle[key].facadeModuleId.split('.').pop();
          const relativeFacade = new URL(`file://${bundle[key].facadeModuleId}`).pathname.replace(apisDir.pathname, `${basePath}/`).replace(`.${ext}`, '');
          const route = `/api${relativeFacade}`;

          if (compilation.manifest.apis.has(route)) {
            const api = compilation.manifest.apis.get(route);

            compilation.manifest.apis.set(route, {
              ...api,
              outputPath: `/api/${key}`
            });
          }
        }
      });
    }
  };
}

function getMetaImportPath(node) {
  return node.arguments[0].value.split('/').join(path.sep)
    .replace(/\\/g, '/'); // handle Windows style paths
}

function isNewUrlImportMetaUrl(node) {
  return (
    node.type === 'NewExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'URL' &&
    node.arguments.length === 2 &&
    node.arguments[0].type === 'Literal' &&
    typeof getMetaImportPath(node) === 'string' &&
    node.arguments[1].type === 'MemberExpression' &&
    node.arguments[1].object.type === 'MetaProperty' &&
    node.arguments[1].property.type === 'Identifier' &&
    node.arguments[1].property.name === 'url'
  );
}

// adapted from, and with credit to @web/rollup-plugin-import-meta-assets
// https://modern-web.dev/docs/building/rollup-plugin-import-meta-assets/
function greenwoodImportMetaUrl(compilation) {

  return {
    name: 'greenwood-import-meta-url',

    async transform(code, id) {
      const resourcePlugins = compilation.config.plugins.filter((plugin) => {
        return plugin.type === 'resource';
      }).map((plugin) => {
        return plugin.provider(compilation);
      });
      const customResourcePlugins = compilation.config.plugins.filter((plugin) => {
        return plugin.type === 'resource' && !plugin.isGreenwoodDefaultPlugin;
      }).map((plugin) => {
        return plugin.provider(compilation);
      });
      const idAssetName = path.basename(id);
      const normalizedId = id.replace(/\\\\/g, '/').replace(/\\/g, '/'); // windows shenanigans...
      let idUrl = new URL(`file://${cleanRollupId(id)}`);
      const headers = {
        'Accept': 'text/javascript'
      };
      const request = new Request(idUrl, {
        headers
      });
      let canTransform = false;
      let response = new Response(code);

      // handle any custom imports or pre-processing needed before passing to Rollup this.parse
      if (await checkResourceExists(idUrl)) {
        for (const plugin of resourcePlugins) {
          if (plugin.shouldResolve && await plugin.shouldResolve(idUrl)) {
            idUrl = new URL((await plugin.resolve(idUrl)).url);
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldServe && await plugin.shouldServe(idUrl, request)) {
            response = await plugin.serve(idUrl, request);
            canTransform = true;
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldPreIntercept && await plugin.shouldPreIntercept(idUrl, request, response)) {
            response = await plugin.preIntercept(idUrl, request, response);
            canTransform = true;
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldIntercept && await plugin.shouldIntercept(idUrl, request, response.clone())) {
            response = await plugin.intercept(idUrl, request, response.clone());
            canTransform = true;
          }
        }
      }

      if (!canTransform) {
        return null;
      }

      const ast = this.parse(await response.text());
      const assetUrls = [];
      let modifiedCode = false;

      // aggregate all references of new URL + import.meta.url
      walk.simple(ast, {
        NewExpression(node) {
          if (isNewUrlImportMetaUrl(node)) {
            const absoluteScriptDir = path.dirname(id);
            const relativeAssetPath = getMetaImportPath(node);
            const absoluteAssetPath = path.resolve(absoluteScriptDir, relativeAssetPath);

            assetUrls.push({
              url: new URL(`file://${absoluteAssetPath}`),
              relativeAssetPath
            });
          }
        }
      });

      for (const assetUrl of assetUrls) {
        const { url } = assetUrl;
        const { pathname } = url;
        const { relativeAssetPath } = assetUrl;
        const assetName = path.basename(pathname);
        const assetExtension = assetName.split('.').pop();
        const assetContents = await fs.promises.readFile(url, 'utf-8');
        const name = assetName.replace(`.${assetExtension}`, '');
        let bundleExtensions = ['js'];

        for (const plugin of customResourcePlugins) {
          if (plugin.shouldServe && await plugin.shouldServe(url)) {
            const response = await plugin.serve(url);

            if (response?.headers?.get('content-type') || ''.indexOf('text/javascript') >= 0) {
              bundleExtensions = [...bundleExtensions, ...plugin.extensions];
            }
          }
        }

        const type = bundleExtensions.indexOf(assetExtension) >= 0
          ? 'chunk'
          : 'asset';
        const emitConfig = type === 'chunk'
          ? { type, id: normalizePathnameForWindows(url), name }
          : { type, name: assetName, source: assetContents };
        const ref = this.emitFile(emitConfig);
        const importRef = `import.meta.ROLLUP_FILE_URL_${ref}`;

        // loop through all URL bundle chunks from APIs and SSR pages
        // and map to their parent file, to pick back up in generateBundle when full hashes are known
        if (`${compilation.context.apisDir.pathname}${idAssetName}`.indexOf(normalizedId) >= 0) {
          for (const entry of compilation.manifest.apis.keys()) {
            const apiRoute = compilation.manifest.apis.get(entry);

            if (normalizedId.endsWith(apiRoute.pagePath.replace('.', ''))) {
              const assets = apiRoute.assets || [];

              assets.push(assetUrl.url.href);

              compilation.manifest.apis.set(entry, {
                ...apiRoute,
                assets
              });
            }
          }
        } else {
          // TODO figure out how to handle URL chunk from SSR pages
          // https://github.com/ProjectEvergreen/greenwood/issues/1163
        }

        modifiedCode = code
          .replace(`'${relativeAssetPath}'`, importRef)
          .replace(`"${relativeAssetPath}"`, importRef);
      }

      return {
        code: modifiedCode ? modifiedCode : code,
        map: null
      };
    },

    // sync bundles from API routes to the corresponding API route's entry in the manifest (useful for adapters)
    generateBundle(options, bundles) {
      for (const bundle in bundles) {
        const bundleExtension = bundle.split('.').pop();
        const apiKey = `/api/${bundle.replace(`.${bundleExtension}`, '')}`;

        if (compilation.manifest.apis.has(apiKey)) {
          const apiManifestDetails = compilation.manifest.apis.get(apiKey);

          for (const reference of bundles[bundle].referencedFiles) {
            if (bundles[reference]) {
              const assets = apiManifestDetails.assets;
              let assetIdx;

              assets.forEach((asset, idx) => {
                // more windows shenanigans...)
                if (asset.indexOf(bundles[reference]?.facadeModuleId?.replace(/\\/g, '/'))) {
                  assetIdx = idx;
                }
              });

              assets[assetIdx] = new URL(`./api/${reference}`, compilation.context.outputDir).href;

              compilation.manifest.apis.set(apiKey, {
                ...apiManifestDetails,
                assets
              });
            }
          }
        }
      }
    }
  };
}

// sync externalized import attributes usages within browser scripts
// to corresponding static bundles, instead of being bundled and shipped as JavaScript
// e.g. import theme from './theme.css' with { type: 'css' }
//   -> import theme from './theme.ab345dcc.css' with { type: 'css' }
//
// this includes:
// - replace all instances of assert with with (until Rollup supports with keyword)
// - sync externalized import attribute paths with bundled CSS paths
function greenwoodSyncImportAttributes(compilation) {
  const unbundledAssetsRefMapper = {};
  const { basePath, polyfills } = compilation.config;
  const { importAttributes } = polyfills;

  return {
    name: 'greenwood-sync-import-attributes',

    generateBundle(options, bundles) {
      const that = this;

      for (const bundle in bundles) {
        if (bundle.endsWith('.map')) {
          return;
        }

        const { code } = bundles[bundle];
        const ast = this.parse(code);

        walk.simple(ast, {
          // Rollup currently emits externals with assert keyword and
          // ideally we get import attributes through the actual AST
          // https://github.com/ProjectEvergreen/greenwood/issues/1218
          ImportDeclaration(node) {
            const { value } = node.source;
            const extension = value.split('.').pop();

            if (externalizedResources.includes(extension)) {
              let preBundled = false;
              let inlineOptimization = false;

              if (importAttributes && importAttributes.includes(extension)) {
                importAttributes.forEach((attribute) => {
                  if (attribute === extension) {
                    bundles[bundle].code = bundles[bundle].code.replace(new RegExp(`"assert{type:"${attribute}"}`, 'g'), `?polyfill=type-${extension}"`);
                  }
                });
              } else {
                bundles[bundle].code = bundles[bundle].code.replace(/assert{/g, 'with{');
              }

              // check for app level assets, like say a shared theme.css
              compilation.resources.forEach((resource) => {
                inlineOptimization = resource.optimizationAttr === 'inline' || compilation.config.optimization === 'inline';

                if (resource.sourcePathURL.pathname === new URL(value, compilation.context.projectDirectory).pathname && !inlineOptimization) {
                  bundles[bundle].code = bundles[bundle].code.replace(value, `/${resource.optimizedFileName}`);
                  preBundled = true;
                }
              });

              // otherwise emit "one-offs" as Rollup assets
              if (!preBundled) {
                const sourceURL = new URL(value, compilation.context.projectDirectory);
                // inline global assets may already be optimized, check for those first
                const source = compilation.resources.get(sourceURL.pathname)?.optimizedFileContents
                  ? compilation.resources.get(sourceURL.pathname).optimizedFileContents
                  : fs.readFileSync(sourceURL, 'utf-8');

                const type = 'asset';
                const emitConfig = { type, name: value.split('/').pop(), source, needsCodeReference: true };
                const ref = that.emitFile(emitConfig);
                const importRef = `import.meta.ROLLUP_ASSET_URL_${ref}`;

                bundles[bundle].code = bundles[bundle].code.replace(value, `${basePath}/${importRef}`);

                if (!unbundledAssetsRefMapper[emitConfig.name]) {
                  unbundledAssetsRefMapper[emitConfig.name] = {
                    importers: [],
                    importRefs: []
                  };
                }

                unbundledAssetsRefMapper[emitConfig.name] = {
                  importers: [...unbundledAssetsRefMapper[emitConfig.name].importers, bundle],
                  importRefs: [...unbundledAssetsRefMapper[emitConfig.name].importRefs, importRef],
                  preBundled,
                  source,
                  sourceURL
                };
              }
            }
          }
        });
      }
    },

    // we use write bundle here to handle import.meta.ROLLUP_ASSET_URL_${ref} linking
    // since it seems that Rollup will not do it after the bundling hook
    // https://github.com/rollup/rollup/blob/v3.29.4/docs/plugin-development/index.md#generatebundle
    async writeBundle(options, bundles) {
      const resourcePlugins = compilation.config.plugins.filter((plugin) => {
        return plugin.type === 'resource';
      }).map((plugin) => {
        return plugin.provider(compilation);
      });

      for (const asset in unbundledAssetsRefMapper) {
        for (const bundle in bundles) {
          const { fileName } = bundles[bundle];
          const ext = fileName.split('.').pop();

          if (externalizedResources.includes(ext)) {
            const hash = fileName.split('.')[fileName.split('.').length - 2];

            if (fileName.replace(`.${hash}`, '') === asset) {
              unbundledAssetsRefMapper[asset].importers.forEach((importer, idx) => {
                let contents = fs.readFileSync(new URL(`./${importer}`, compilation.context.outputDir), 'utf-8');

                contents = contents.replace(unbundledAssetsRefMapper[asset].importRefs[idx], fileName);

                fs.writeFileSync(new URL(`./${importer}`, compilation.context.outputDir), contents);
              });

              // have to apply Greenwood's optimizing here instead of in generateBundle
              // since we can't do async work inside a sync AST operation
              if (!asset.preBundled) {
                const type = ext === 'css'
                  ? 'text/css'
                  : ext === 'css'
                    ? 'application/json'
                    : '';
                const assetUrl = importAttributes && importAttributes.includes(ext)
                  ? new URL(`${unbundledAssetsRefMapper[asset].sourceURL.href}?polyfill=type-${ext}`)
                  : unbundledAssetsRefMapper[asset].sourceURL;

                const request = new Request(assetUrl, { headers: { 'Accept': type } });
                let response = new Response(unbundledAssetsRefMapper[asset].source, { headers: { 'Content-Type': type } });

                for (const plugin of resourcePlugins) {
                  if (plugin.shouldPreIntercept && await plugin.shouldPreIntercept(assetUrl, request, response.clone())) {
                    response = await plugin.preIntercept(assetUrl, request, response.clone());
                  }
                }

                for (const plugin of resourcePlugins) {
                  if (plugin.shouldIntercept && await plugin.shouldIntercept(assetUrl, request, response.clone())) {
                    response = await plugin.intercept(assetUrl, request, response.clone());
                  }
                }

                for (const plugin of resourcePlugins) {
                  if (plugin.shouldOptimize && await plugin.shouldOptimize(assetUrl, response.clone())) {
                    response = await plugin.optimize(assetUrl, response.clone());
                  }
                }

                fs.writeFileSync(new URL(`./${fileName}`, compilation.context.outputDir), await response.text());
              }
            }
          }
        }
      }
    }
  };

}

const getRollupConfigForBrowserScripts = async (compilation) => {
  const { outputDir } = compilation.context;
  const input = [...compilation.resources.values()]
    .filter(resource => resource.type === 'script')
    .map(resource => normalizePathnameForWindows(resource.sourcePathURL));
  const customRollupPlugins = compilation.config.plugins.filter(plugin => {
    return plugin.type === 'rollup';
  }).map(plugin => {
    return plugin.provider(compilation);
  }).flat();

  return [{
    preserveEntrySignatures: 'strict', // https://github.com/ProjectEvergreen/greenwood/pull/990
    input,
    output: {
      dir: normalizePathnameForWindows(outputDir),
      entryFileNames: '[name].[hash].js',
      chunkFileNames: '[name].[hash].js',
      assetFileNames: '[name].[hash].[ext]',
      sourcemap: true
    },
    plugins: [
      greenwoodResourceLoader(compilation, true),
      greenwoodSyncPageResourceBundlesPlugin(compilation),
      greenwoodSyncImportAttributes(compilation),
      greenwoodImportMetaUrl(compilation),
      ...customRollupPlugins
    ],
    context: 'window',
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
    }
  }];
};

const getRollupConfigForApiRoutes = async (compilation) => {
  const { outputDir, pagesDir, apisDir } = compilation.context;

  return [...compilation.manifest.apis.values()]
    .map(api => normalizePathnameForWindows(new URL(api.pagePath, pagesDir)))
    .map((filepath) => {
      // account for windows pathname shenanigans by "casting" filepath to a URL first
      const ext = filepath.split('.').pop();
      const entryName = new URL(`file://${filepath}`).pathname.replace(apisDir.pathname, '').replace(/\//g, '-').replace(`.${ext}`, '');

      return {
        input: filepath,
        output: {
          dir: `${normalizePathnameForWindows(outputDir)}/api`,
          entryFileNames: `${entryName}.js`,
          chunkFileNames: `${entryName}.[hash].js`
        },
        plugins: [
          greenwoodResourceLoader(compilation),
          // support node export conditions for SSR pages
          // https://github.com/ProjectEvergreen/greenwood/issues/1118
          // https://github.com/rollup/plugins/issues/362#issuecomment-873448461
          nodeResolve({
            exportConditions: ['node'],
            preferBuiltins: true
          }),
          commonjs(),
          greenwoodImportMetaUrl(compilation),
          greenwoodSyncApiRoutesOutputPath(compilation)
        ],
        onwarn: (errorObj) => {
          const { code, message } = errorObj;

          switch (code) {

            case 'CIRCULAR_DEPENDENCY':
              // let this through for WCC + sucrase
              // Circular dependency: ../../../../../node_modules/sucrase/dist/esm/parser/tokenizer/index.js ->
              //   ../../../../../node_modules/sucrase/dist/esm/parser/traverser/util.js -> ../../../../../node_modules/sucrase/dist/esm/parser/tokenizer/index.js
              // Circular dependency: ../../../../../node_modules/sucrase/dist/esm/parser/tokenizer/index.js ->
              //   ../../../../../node_modules/sucrase/dist/esm/parser/tokenizer/readWord.js -> ../../../../../node_modules/sucrase/dist/esm/parser/tokenizer/index.js
              // https://github.com/ProjectEvergreen/greenwood/pull/1212
              // https://github.com/lit/lit/issues/449#issuecomment-416688319
              break;
            default:
              // otherwise, log all warnings from rollup
              console.debug(message);

          }
        }
      };
    });
};

const getRollupConfigForSsrPages = async (compilation, input) => {
  const { outputDir } = compilation.context;

  return input.map((filepath) => {
    const ext = filepath.split('.').pop();
    // account for windows pathname shenanigans by "casting" filepath to a URL first
    const entryName = new URL(`file://${filepath}`).pathname.replace(compilation.context.scratchDir.pathname, '').replace('/', '-').replace(`.${ext}`, '');

    return {
      input: filepath,
      output: {
        dir: normalizePathnameForWindows(outputDir),
        entryFileNames: `${entryName}.route.js`,
        chunkFileNames: `${entryName}.route.chunk.[hash].js`
      },
      plugins: [
        greenwoodResourceLoader(compilation),
        // support node export conditions for SSR pages
        // https://github.com/ProjectEvergreen/greenwood/issues/1118
        // https://github.com/rollup/plugins/issues/362#issuecomment-873448461
        nodeResolve({
          exportConditions: ['node'],
          preferBuiltins: true
        }),
        commonjs(),
        greenwoodImportMetaUrl(compilation),
        greenwoodSyncSsrEntryPointsOutputPaths(compilation)
      ],
      onwarn: (errorObj) => {
        const { code, message } = errorObj;

        switch (code) {

          case 'CIRCULAR_DEPENDENCY':
            // let this through for lit
            // Error: the string "Circular dependency: ../../../../../node_modules/@lit-labs/ssr/lib/render-lit-html.js ->
            // ../../../../../node_modules/@lit-labs/ssr/lib/lit-element-renderer.js -> ../../../../../node_modules/@lit-labs/ssr/lib/render-lit-html.js\n" was thrown, throw an Error :)
            // https://github.com/ProjectEvergreen/greenwood/issues/1118
            // https://github.com/lit/lit/issues/449#issuecomment-416688319
            // https://github.com/rollup/rollup/issues/1089#issuecomment-402109607
            break;
          default:
            // otherwise, log all warnings from rollup
            console.debug(message);

        }
      }
    };
  });
};

export {
  getRollupConfigForApiRoutes,
  getRollupConfigForBrowserScripts,
  getRollupConfigForSsrPages
};