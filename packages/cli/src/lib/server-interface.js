class ServerInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
  }
  async start() {
    return Promise.resolve(false);
  }
  async stop() {
    return Promise.resolve(false);
  }
}
module.exports = {
  ServerInterface
};