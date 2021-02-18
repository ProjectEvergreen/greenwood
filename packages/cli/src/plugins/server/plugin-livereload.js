const livereload = require('livereload');
const path = require('path');
const { ResourceInterface } = require('../../lib/resource-interface');
const { ServerInterface } = require('../../lib/server-interface');

class LiveReloadServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);

    this.liveReloadServer = livereload.createServer({
      exts: ['html', 'css', 'js', 'md'],
      applyCSSLive: false // https://github.com/napcs/node-livereload/issues/33#issuecomment-693707006
    });
  }

  async start() {
    const { userWorkspace } = this.compilation.context;

    this.liveReloadServer.watch(userWorkspace, () => {
      console.info(`Now watching directory "${userWorkspace}" for changes.`);
      return Promise.resolve(true);
    });
  }
}

class LiveReloadResource extends ResourceInterface {
  
  async shouldIntercept(url) {
    return Promise.resolve(path.extname(url) === '' && process.env.__GWD_COMMAND__ === 'develop'); // eslint-disable-line no-underscore-dangle
  }

  async intercept(url, body) {
    return new Promise((resolve, reject) => {
      try {
        const contents = body.replace('</head>', `
            <script src="http://localhost:35729/livereload.js?snipver=1"></script>
          </head>
        `);

        resolve(contents);
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