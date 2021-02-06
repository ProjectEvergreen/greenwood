const { ServerInterface } = require('../../lib/server-interface');
const livereload = require('livereload');

class LiveReloadServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);
  }

  async start() {
    this.liveReloadServer = livereload.createServer({
      exts: ['html', 'css', 'js', 'md'],
      applyCSSLive: false // https://github.com/napcs/node-livereload/issues/33#issuecomment-693707006
    });
    this.liveReloadServer.watch(this.compilation.context.userWorkspace, () => {
      console.info(`Now watching directory "${this.compilation.context.userWorkspace}" for changes.`);
    });
    return Promise.resolve(true);
  }

  async stop() {
    return Promise.resolve(false);
  }
}

module.exports = (options = {}) => {
  return {
    type: 'server',
    name: 'plugin-live-reload',
    provider: (compilation) => new LiveReloadServer(compilation, options)
  };
};