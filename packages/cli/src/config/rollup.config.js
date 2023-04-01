import fs from 'fs/promises';
import { checkResourceExists, normalizePathnameForWindows } from '../lib/resource-utils.js';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { importMetaAssets } from '@web/rollup-plugin-import-meta-assets';

// specifically to handle escodegen using require for package.json
// https://github.com/estools/escodegen/issues/455
function greenwoodJsonLoader() {
  return {
    name: 'greenwood-json-loader',
    async load(id) {
      const extension = id.split('.').pop();

      if (extension === 'json') {
        const url = new URL(`file://${id}`);
        const json = JSON.parse(await fs.readFile(url, 'utf-8'));
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
      const normalizedId = id.replace(/\?type=(.*)/, '');
      const { projectDirectory, userWorkspace } = compilation.context;

      if (id.startsWith('.') && !id.startsWith(projectDirectory.pathname)) {
        const prefix = id.startsWith('..') ? './' : '';
        const userWorkspaceUrl = new URL(`${prefix}${normalizedId.replace(/\.\.\//g, '')}`, userWorkspace);

        if (await checkResourceExists(userWorkspaceUrl)) {
          return normalizePathnameForWindows(userWorkspaceUrl);
        }
      }
    },
    async load(id) {
      const pathname = id.indexOf('?') >= 0 ? id.slice(0, id.indexOf('?')) : id;
      const extension = pathname.split('.').pop();

      if (extension !== '' && extension !== 'js') {
        const url = new URL(`file://${pathname}?type=${extension}`);
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
              optimizedFileContents: await fs.readFile(outputPath, 'utf-8'),
              contents: contents.replace(/\.\//g, '/')
            });

            if (noop) {
              await fs.writeFile(outputPath, contents);
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

  // TODO should routes and APIs have chunks?
  // https://github.com/ProjectEvergreen/greenwood/issues/1008
  return [{
    input,
    output: {
      dir: `${normalizePathnameForWindows(outputDir)}/api`,
      entryFileNames: '[name].js',
      chunkFileNames: '[name].[hash].js'
    },
    plugins: [
      greenwoodJsonLoader(),
      nodeResolve(),
      commonjs(),
      importMetaAssets()
    ]
  }];
};

const getRollupConfigForSsr = async (compilation, input) => {
  const { outputDir } = compilation.context;

  // TODO should routes and APIs have chunks?
  // https://github.com/ProjectEvergreen/greenwood/issues/1008
  return [{
    input,
    output: {
      dir: normalizePathnameForWindows(outputDir),
      entryFileNames: '_[name].js',
      chunkFileNames: '[name].[hash].js'
    },
    plugins: [
      greenwoodJsonLoader(),
      nodeResolve(),
      commonjs(),
      importMetaAssets()
    ]
  }];
};

export {
  getRollupConfigForApis,
  getRollupConfigForScriptResources,
  getRollupConfigForSsr
};