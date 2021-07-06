const fs = require('fs');
const livereload = require('livereload');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
const { ServerInterface } = require('../../lib/server-interface');

class LiveReloadServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    const { userWorkspace } = this.compilation.context;
    const standardPluginsPath = path.join(__dirname, '../', 'resource');
    const standardPluginsExtensions = fs.readdirSync(standardPluginsPath)
      .filter(filename => filename.indexOf('plugin-standard') === 0)
      .map((filename) => {
        return require(`${standardPluginsPath}/${filename}`);
      })
      .map((plugin) => {
        // assume that if it is an array, the second item is a rollup plugin
        const instance = plugin.length
          ? plugin[0].provider(this.compilation)
          : plugin.provider(this.compilation);

        return instance.extensions.flat();
      })
      .flat();
    const customPluginsExtensions = this.compilation.config.plugins
      .filter((plugin) => plugin.type === 'resource')
      .map((plugin) => {
        return plugin.provider(this.compilation).extensions.flat();
      }).flat();

    // filter out wildcards or otherwise undesired values and remove any . since livereload likes them that way
    const allExtensions = [
      ...standardPluginsExtensions,
      ...customPluginsExtensions,
      ...this.compilation.config.devServer.extensions
    ]
      .filter((ext) => ext !== '*' || ext !== '')
      .map((ext) => ext.replace('.', ''));

    console.debug('allExtentions', allExtensions.filter((ext, idx) => idx === allExtensions.indexOf(ext)));
    const liveReloadServer = livereload.createServer({
      exts: allExtensions.filter((ext, idx) => idx === allExtensions.indexOf(ext)),
      applyCSSLive: false // https://github.com/napcs/node-livereload/issues/33#issuecomment-693707006
    });

    liveReloadServer.watch(userWorkspace, () => {
      console.info(`Now watching directory "${userWorkspace}" for changes.`);
      return Promise.resolve(true);
    });
  }
}

class LiveReloadResource extends ResourceInterface {
  
  async shouldIntercept(url, body, headers) {
    const { accept } = headers.request;

    return Promise.resolve(accept && accept.indexOf('text/html') >= 0 && process.env.__GWD_COMMAND__ === 'develop'); // eslint-disable-line no-underscore-dangle
  }

  async intercept(url, body) {
    return new Promise((resolve, reject) => {
      try {
        const contents = body.replace('</head>', `
            <script src="http://localhost:35729/livereload.js?snipver=1"></script>
          </head>
        `);

        resolve({ body: contents });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
  return [{
    type: 'server',
    name: 'plugin-live-reload:server',
    provider: (compilation) => new LiveReloadServer(compilation, options)
  }, {
    type: 'resource',
    name: 'plugin-live-reload:resource',
    provider: (compilation) => new LiveReloadResource(compilation, options)
  }];
};