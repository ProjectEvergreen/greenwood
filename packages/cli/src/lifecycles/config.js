const fs = require('fs');
const path = require('path');

// TODO const optimizations = ['strict', 'spa'];
let defaultConfig = {
  workspace: path.join(process.cwd(), 'src'),
  devServer: {
    port: 1984
  },
  // TODO optimization: 'spa',
  title: 'My App',
  meta: [],
  plugins: [],
  markdown: { plugins: [], settings: {} }
};

module.exports = readAndMergeConfig = async() => {
  // eslint-disable-next-line complexity
  return new Promise(async (resolve, reject) => {
    try {
      // deep clone of default config
      let customConfig = Object.assign({}, defaultConfig);
      
      if (fs.existsSync(path.join(process.cwd(), 'greenwood.config.js'))) {
        const userCfgFile = require(path.join(process.cwd(), 'greenwood.config.js'));
        const { workspace, devServer, title, markdown, meta, plugins } = userCfgFile;

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

        // TODO
        // if (typeof optimization === 'string' && optimizations.indexOf(optimization.toLowerCase()) >= 0) {
        //   customConfig.optimization = optimization;
        // } else if (optimization) {
        //   reject(`Error: provided optimization "${optimization}" is not supported.  Please use one of: ${optimizations.join(', ')}.`);
        // }

        if (plugins && plugins.length > 0) {
          const types = ['resource'];

          plugins.forEach(plugin => {
            if (!plugin.type || types.indexOf(plugin.type) < 0) {
              reject(`Error: greenwood.config.js plugins must be one of type "${types.join(', ')}". got "${plugin.type}" instead.`);
            }

            if (!plugin.provider || typeof plugin.provider !== 'function') {
              const providerTypeof = typeof plugin.provider;

              reject(`Error: greenwood.config.js plugins provider must of type function. got ${providerTypeof} instead.`);
            }
          });

          customConfig.plugins = customConfig.plugins.concat(plugins);
        }

        if (devServer && Object.keys(devServer).length > 0) {

          if (devServer.port) {
            // eslint-disable-next-line max-depth
            if (!Number.isInteger(devServer.port)) {
              reject(`Error: greenwood.config.js devServer port must be an integer.  Passed value was: ${devServer.port}`);
            } else {
              customConfig.devServer.port = devServer.port;
              // console.log(`custom port provided => ${customConfig.devServer.port}`);
            }
          }
        }

        if (markdown && Object.keys(markdown).length > 0) {
          customConfig.markdown.plugins = markdown.plugins && markdown.plugins.length > 0 ? markdown.plugins : [];
          customConfig.markdown.settings = markdown.settings ? markdown.settings : {};
        }
      }
      resolve({ ...defaultConfig, ...customConfig });
    } catch (err) {
      reject(err);
    }
  });
};