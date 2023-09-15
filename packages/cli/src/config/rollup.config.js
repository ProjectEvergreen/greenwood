import fs from 'fs';
import path from 'path';
import { checkResourceExists, normalizePathnameForWindows } from '../lib/resource-utils.js';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import * as walk from 'acorn-walk';

// https://github.com/rollup/rollup/issues/2121
function cleanRollupId(id) {
  return id.replace('\x00', '');
}

// specifically to handle escodegen and other node modules
// using require for package.json or other json files
// https://github.com/estools/escodegen/issues/455
function greenwoodJsonLoader() {
  return {
    name: 'greenwood-json-loader',
    async load(id) {
      const idUrl = new URL(`file://${cleanRollupId(id)}`);
      const extension = idUrl.pathname.split('.').pop();

      if (extension === 'json') {
        const json = JSON.parse(await fs.promises.readFile(idUrl, 'utf-8'));
        const contents = `export default ${JSON.stringify(json)}`;

        return contents;
      }
    }
  };
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
  return node.arguments[0].value.split('/').join(path.sep);
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
function greenwoodImportMetaUrl() {

  return {
    name: 'greenwood-import-meta-url',

    async transform(code, id) {
      // TODO allow other import types?
      if (!id.endsWith('.js')) {
        return null;
      }

      const ast = this.parse(code);
      const that = this;
      let modifiedCode = false;

      walk.simple(ast, {
        NewExpression(node) {
          if (isNewUrlImportMetaUrl(node)) {
            const absoluteScriptDir = path.dirname(id);
            const relativeAssetPath = getMetaImportPath(node);
            const absoluteAssetPath = path.resolve(absoluteScriptDir, relativeAssetPath);
            const assetName = path.basename(absoluteAssetPath);

            try {
              const assetContents = fs.readFileSync(absoluteAssetPath, 'utf-8');
              let ref;

              if (absoluteAssetPath.endsWith('.js')) {
                ref = that.emitFile({
                  type: 'chunk',
                  id: absoluteAssetPath,
                  name: assetName.replace('.js', '')
                });
              } else {
                ref = that.emitFile({
                  type: 'asset',
                  name: assetName,
                  source: assetContents
                });
              }

              const importRef = `import.meta.ROLLUP_FILE_URL_${ref}`;

              modifiedCode = code
                .replace(`'${relativeAssetPath}'`, importRef)
                .replace(`"${relativeAssetPath}"`, importRef);
            } catch (error) {
              that.error(error, node.arguments[0].start);
            }
          }
        }
      });

      return {
        code: modifiedCode ? modifiedCode : code
      };
    }
  };
}

// TODO could we use this instead?
// https://github.com/rollup/rollup/blob/v2.79.1/docs/05-plugin-development.md#resolveimportmeta
// https://github.com/ProjectEvergreen/greenwood/issues/1087
function greenwoodPatchSsrPagesEntryPointRuntimeImport() {
  return {
    name: 'greenwood-patch-ssr-pages-entry-point-runtime-import',
    generateBundle(options, bundle) {
      Object.keys(bundle).forEach((key) => {
        if (key.startsWith('__')) {
          // ___GWD_ENTRY_FILE_URL=${filename}___
          const needle = bundle[key].code.match(/___GWD_ENTRY_FILE_URL=(.*.)___/);
          if (needle) {
            const entryPathMatch = needle[1];

            bundle[key].code = bundle[key].code.replace(/'___GWD_ENTRY_FILE_URL=(.*.)___'/, `new URL('./_${entryPathMatch}', import.meta.url)`);
          } else {
            console.warn(`Could not find entry path match for bundle => ${ley}`);
          }
        }
      });
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
  const input = [...compilation.manifest.apis.values()]
    .map(api => normalizePathnameForWindows(new URL(`.${api.path}`, userWorkspace)));

  // why is this needed?
  await fs.promises.mkdir(new URL('./api/assets/', outputDir), {
    recursive: true
  });

  // TODO should routes and APIs have chunks?
  // https://github.com/ProjectEvergreen/greenwood/issues/1118
  return [{
    input,
    output: {
      dir: `${normalizePathnameForWindows(outputDir)}/api`,
      entryFileNames: '[name].js',
      chunkFileNames: '[name].[hash].js'
    },
    plugins: [
      greenwoodJsonLoader(),
      greenwoodResourceLoader(compilation),
      nodeResolve(),
      commonjs(),
      greenwoodImportMetaUrl()
    ]
  }];
};

const getRollupConfigForSsr = async (compilation, input) => {
  const { outputDir } = compilation.context;

  // TODO should routes and APIs have chunks?
  // https://github.com/ProjectEvergreen/greenwood/issues/1118
  return [{
    input,
    output: {
      dir: normalizePathnameForWindows(outputDir),
      entryFileNames: '_[name].js',
      chunkFileNames: '[name].[hash].js'
    },
    plugins: [
      greenwoodJsonLoader(),
      greenwoodResourceLoader(compilation),
      // TODO let this through for lit to enable nodeResolve({ preferBuiltins: true })
      // https://github.com/lit/lit/issues/449
      // https://github.com/ProjectEvergreen/greenwood/issues/1118
      nodeResolve({
        preferBuiltins: true
      }),
      commonjs(),
      greenwoodImportMetaUrl(),
      greenwoodPatchSsrPagesEntryPointRuntimeImport() // TODO a little hacky but works for now
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
  }];
};

export {
  getRollupConfigForApis,
  getRollupConfigForScriptResources,
  getRollupConfigForSsr
};