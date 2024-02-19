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
  return id.replace('\x00', '');
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
      const idUrl = new URL(`file://${cleanRollupId(id)}`);
      const { pathname } = idUrl;
      const extension = pathname.split('.').pop();

      // filter first for any bare specifiers
      if (await checkResourceExists(idUrl) && extension !== '' && extension !== 'js') {
        const url = new URL(`${idUrl.href}?type=${extension}`);
        const request = new Request(url.href);
        let response = new Response('');

        for (const plugin of resourcePlugins) {
          if (plugin.shouldServe && await plugin.shouldServe(url, request)) {
            response = await plugin.serve(url, request);
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldIntercept && await plugin.shouldIntercept(url, request, response.clone())) {
            response = await plugin.intercept(url, request, response.clone());
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
      const idUrl = new URL(`file://${cleanRollupId(id)}`);
      const { pathname } = idUrl;
      const extension = pathname.split('.').pop();
      const urlWithType = new URL(`${idUrl.href}?type=${extension}`);
      const request = new Request(urlWithType.href);
      let canTransform = false;
      let response = new Response(code);

      // handle any custom imports or pre-processing needed before passing to Rollup this.parse
      if (await checkResourceExists(idUrl) && extension !== '' && extension !== 'json') {
        for (const plugin of resourcePlugins) {
          if (plugin.shouldServe && await plugin.shouldServe(urlWithType, request)) {
            response = await plugin.serve(urlWithType, request);
            canTransform = true;
          }
        }

        for (const plugin of resourcePlugins) {
          if (plugin.shouldIntercept && await plugin.shouldIntercept(urlWithType, request, response.clone())) {
            response = await plugin.intercept(urlWithType, request, response.clone());
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
            const assetName = path.basename(absoluteAssetPath);
            const assetExtension = assetName.split('.').pop();

            assetUrls.push({
              url: new URL(`file://${absoluteAssetPath}?type=${assetExtension}`),
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
        if (id.indexOf(compilation.context.apisDir.pathname) === 0) {
          for (const entry of compilation.manifest.apis.keys()) {
            const apiRoute = compilation.manifest.apis.get(entry);

            if (id.endsWith(apiRoute.path)) {
              const assets = apiRoute.assets || [];

              assets.push(assetUrl.url.pathname);

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
              const assetIdx = assets.indexOf(bundles[reference].facadeModuleId);

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
  const { outputDir, userWorkspace } = compilation.context;

  // why is this needed?
  await fs.promises.mkdir(new URL('./api/assets/', outputDir), {
    recursive: true
  });

  return [...compilation.manifest.apis.values()]
    .map(api => normalizePathnameForWindows(new URL(`.${api.path}`, userWorkspace)))
    .map(filepath => ({
      input: filepath,
      output: {
        dir: `${normalizePathnameForWindows(outputDir)}/api`,
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js'
      },
      plugins: [
        greenwoodResourceLoader(compilation),
        nodeResolve({
          exportConditions: ['node'],
          preferBuiltins: true
        }),
        commonjs(),
        greenwoodImportMetaUrl(compilation)
      ]
    }));
};

const getRollupConfigForSsr = async (compilation, input) => {
  const { outputDir } = compilation.context;

  return input.map(filepath => ({
    input: filepath,
    output: {
      dir: normalizePathnameForWindows(outputDir),
      entryFileNames: '[name].route.js',
      chunkFileNames: '[name].route.chunk.[hash].js'
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
          // TODO let this through for lit by suppressing it
          // Error: the string "Circular dependency: ../../../../../node_modules/@lit-labs/ssr/lib/render-lit-html.js ->
          // ../../../../../node_modules/@lit-labs/ssr/lib/lit-element-renderer.js -> ../../../../../node_modules/@lit-labs/ssr/lib/render-lit-html.js\n" was thrown, throw an Error :)
          // https://github.com/lit/lit/issues/449
          // https://github.com/ProjectEvergreen/greenwood/issues/1118
          break;
        default:
          // otherwise, log all warnings from rollup
          console.debug(message);

      }
    }
  }));
};

export {
  getRollupConfigForApis,
  getRollupConfigForScriptResources,
  getRollupConfigForSsr
};