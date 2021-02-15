class ServerInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation;
    this.options = options;
  }
  
  async start() {
    return Promise.resolve(true);
  }
  
  async stop() {
    return Promise.resolve(true);
  }
}

module.exports = {
  ServerInterface
};