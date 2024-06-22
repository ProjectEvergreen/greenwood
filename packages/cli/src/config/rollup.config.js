/* eslint-disable complexity */
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

function greenwoodResourceLoader (compilation) {
  const resourcePlugins = compilation.config.plugins.filter((plugin) => {
    return plugin.type === 'resource';
  }).map((plugin) => {
    return plugin.provider(compilation);
  });

  return {
    name: 'greenwood-resource-loader',
    async resolveId(id) {
      const normalizedId = cleanRollupId(id); // idUrl.pathname;
      const { projectDirectory, userWorkspace } = compilation.context;

      if (normalizedId.startsWith('.') && !normalizedId.startsWith(projectDirectory.pathname)) {
        const prefix = normalizedId.startsWith('..') ? './' : '';
        const userWorkspaceUrl = new URL(`${prefix}${normalizedId.replace(/\.\.\//g, '')}`, userWorkspace);

        if (await checkResourceExists(userWorkspaceUrl)) {
          return normalizePathnameForWindows(userWorkspaceUrl);
        }
      }
    },
    async load(id) {
      let idUrl = new URL(`file://${cleanRollupId(id)}`);
      const { pathname } = idUrl;
      const extension = pathname.split('.').pop();
      const headers = {
        'Accept': 'text/javascript',
        'Sec-Fetch-Dest': 'empty'
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
        'Accept': 'text/javascript',
        'Sec-Fetch-Dest': 'empty'
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

            if (normalizedId.endsWith(apiRoute.path)) {
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

const getRollupConfigForScriptResources = async (compilation) => {
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
      sourcemap: true
    },
    plugins: [
      greenwoodResourceLoader(compilation),
      greenwoodSyncPageResourceBundlesPlugin(compilation),
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

const getRollupConfigForApis = async (compilation) => {
  const { outputDir, pagesDir } = compilation.context;

  return [...compilation.manifest.apis.values()]
    .map(api => normalizePathnameForWindows(new URL(`.${api.path}`, pagesDir)))
    .map(filepath => ({
      input: filepath,
      output: {
        dir: `${normalizePathnameForWindows(outputDir)}/api`,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js'
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
        greenwoodImportMetaUrl(compilation)
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
    }));
};

const getRollupConfigForSsr = async (compilation, input) => {
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
  getRollupConfigForApis,
  getRollupConfigForScriptResources,
  getRollupConfigForSsr
};