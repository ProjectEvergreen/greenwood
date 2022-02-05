import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL, URL } from 'url';

// get and "tag" all plugins provided / maintained by the @greenwood/cli
// and include as the default set, with all user plugins getting appended
const greenwoodPluginsBasePath = fileURLToPath(new URL('../plugins', import.meta.url));

const greenwoodPlugins = (await Promise.all([
  path.join(greenwoodPluginsBasePath, 'copy'),
  path.join(greenwoodPluginsBasePath, 'renderer'),
  path.join(greenwoodPluginsBasePath, 'resource'),
  path.join(greenwoodPluginsBasePath, 'server')
].map(async (pluginDirectory) => {
  const files = await fs.promises.readdir(pluginDirectory);

  return (await Promise.all(files.map(async(file) => {
    const importPaTh = pathToFileURL(`${pluginDirectory}${path.sep}${file}`);
    const pluginImport = await import(importPaTh);
    const plugin = pluginImport[Object.keys(pluginImport)[0]];

    return Array.isArray(plugin)
      ? plugin
      : [plugin];
  }))).flat();
}).flat())).flat().map((plugin) => {
  return {
    isGreenwoodDefaultPlugin: true,
    ...plugin
  };
});

const optimizations = ['default', 'none', 'static', 'inline'];
const pluginTypes = ['copy', 'context', 'resource', 'rollup', 'server', 'source', 'renderer'];
const defaultConfig = {
  workspace: path.join(process.cwd(), 'src'),
  devServer: {
    hud: true,
    port: 1984,
    extensions: []
  },
  port: 8080,
  optimization: optimizations[0],
  title: 'My App',
  meta: [],
  plugins: greenwoodPlugins,
  markdown: { plugins: [], settings: {} },
  prerender: true,
  pagesDirectory: 'pages',
  templatesDirectory: 'templates'
};

const readAndMergeConfig = async() => {
  // eslint-disable-next-line complexity
  return new Promise(async (resolve, reject) => {
    try {
      // deep clone of default config
      let customConfig = Object.assign({}, defaultConfig);

      if (fs.existsSync(path.join(process.cwd(), 'greenwood.config.js'))) {
        const userCfgFile = (await import(pathToFileURL(path.join(process.cwd(), 'greenwood.config.js')))).default;
        const { workspace, devServer, title, markdown, meta, optimization, plugins, port, prerender, staticRouter, pagesDirectory, templatesDirectory } = userCfgFile;

        // workspace validation
        if (workspace) {
          if (typeof workspace !== 'string') {
            reject('Error: greenwood.config.js workspace path must be a string');
          }

          if (!path.isAbsolute(workspace)) {
            // prepend relative path with current directory
            customConfig.workspace = path.join(process.cwd(), workspace);
          }

          if (path.isAbsolute(workspace)) {
            // use the users provided path
            customConfig.workspace = workspace;
          }

          if (!fs.existsSync(customConfig.workspace)) {
            reject('Error: greenwood.config.js workspace doesn\'t exist! \n' +
              'common issues to check might be: \n' +
              '- typo in your workspace directory name, or in greenwood.config.js \n' +
              '- if using relative paths, make sure your workspace is in the same cwd as _greenwood.config.js_ \n' +
              '- consider using an absolute path, e.g. path.join(__dirname, \'my\', \'custom\', \'path\') // <__dirname>/my/custom/path/ ');
          }
        }

        if (title) {
          if (typeof title !== 'string') {
            reject('Error: greenwood.config.js title must be a string');
          }
          customConfig.title = title;
        }

        if (meta && meta.length > 0) {
          customConfig.meta = meta;
        }

        if (typeof optimization === 'string' && optimizations.indexOf(optimization.toLowerCase()) >= 0) {
          customConfig.optimization = optimization;
        } else if (optimization) {
          reject(`Error: provided optimization "${optimization}" is not supported.  Please use one of: ${optimizations.join(', ')}.`);
        }

        if (plugins && plugins.length > 0) {
          plugins.forEach(plugin => {
            if (!plugin.type || pluginTypes.indexOf(plugin.type) < 0) {
              reject(`Error: greenwood.config.js plugins must be one of type "${pluginTypes.join(', ')}". got "${plugin.type}" instead.`);
            }

            if (!plugin.provider || typeof plugin.provider !== 'function') {
              const providerTypeof = typeof plugin.provider;

              reject(`Error: greenwood.config.js plugins provider must be a function. got ${providerTypeof} instead.`);
            }

            if (!plugin.name || typeof plugin.name !== 'string') {
              const nameTypeof = typeof plugin.name;

              reject(`Error: greenwood.config.js plugins must have a name. got ${nameTypeof} instead.`);
            }
          });

          // if user provides a custom renderer, replace ours with theirs
          if (plugins.filter(plugin => plugin.type === 'renderer').length === 1) {
            customConfig.plugins = customConfig.plugins.filter((plugin) => {
              return plugin.type !== 'renderer';
            });
          }

          customConfig.plugins = customConfig.plugins.concat(plugins);
        }

        if (devServer && Object.keys(devServer).length > 0) {

          if (devServer.hasOwnProperty('hud')) {
            if (typeof devServer.hud === 'boolean') {
              customConfig.devServer.hud = devServer.hud;
            } else {
              reject(`Error: greenwood.config.js devServer hud options must be a boolean.  Passed value was: ${devServer.hud}`);
            }
          }

          if (devServer.port) {
            // eslint-disable-next-line max-depth
            if (!Number.isInteger(devServer.port)) {
              reject(`Error: greenwood.config.js devServer port must be an integer.  Passed value was: ${devServer.port}`);
            } else {
              customConfig.devServer.port = devServer.port;
            }
          }

          if (devServer.proxy) {
            customConfig.devServer.proxy = devServer.proxy;
          }

          if (devServer.extensions) {
            if (Array.isArray(devServer.extensions)) {
              customConfig.devServer.extensions = devServer.extensions;
            } else {
              reject('Error: provided extensions is not an array.  Please provide an array like [\'.txt\', \'.foo\']');
            }
          }
        }

        if (markdown && Object.keys(markdown).length > 0) {
          customConfig.markdown.plugins = markdown.plugins && markdown.plugins.length > 0 ? markdown.plugins : [];
          customConfig.markdown.settings = markdown.settings ? markdown.settings : {};
        }

        if (port) {
          // eslint-disable-next-line max-depth
          if (!Number.isInteger(port)) {
            reject(`Error: greenwood.config.js port must be an integer.  Passed value was: ${port}`);
          } else {
            customConfig.port = port;
          }
        }

        if (pagesDirectory && typeof pagesDirectory === 'string') {
          customConfig.pagesDirectory = pagesDirectory;
        } else if (pagesDirectory) {
          reject(`Error: provided pagesDirectory "${pagesDirectory}" is not supported.  Please make sure to pass something like 'docs/'`);
        }

        if (templatesDirectory && typeof templatesDirectory === 'string') {
          customConfig.templatesDirectory = templatesDirectory;
        } else if (templatesDirectory) {
          reject(`Error: provided templatesDirectory "${templatesDirectory}" is not supported.  Please make sure to pass something like 'layouts/'`);
        }

        if (prerender !== undefined) {
          if (typeof prerender === 'boolean') {
            customConfig.prerender = prerender;
          } else {
            reject(`Error: greenwood.config.js prerender must be a boolean; true or false.  Passed value was typeof: ${typeof prerender}`);
          }
        }

        // SPA should _not_ prerender unless if user has specified prerender should be true
        if (prerender === undefined && fs.existsSync(path.join(customConfig.workspace, 'index.html'))) {
          customConfig.prerender = false;
        }

        if (staticRouter !== undefined) {
          if (typeof staticRouter === 'boolean') {
            customConfig.staticRouter = staticRouter;
          } else {
            reject(`Error: greenwood.config.js staticRouter must be a boolean; true or false.  Passed value was typeof: ${typeof staticRouter}`);
          }
        }
      }

      resolve({ ...defaultConfig, ...customConfig });
    } catch (err) {
      reject(err);
    }
  });
};

export { readAndMergeConfig };