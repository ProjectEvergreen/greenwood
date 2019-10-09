const puppeteer = require('puppeteer');
const { Renderer } = require('./renderer');

class BrowserRunner {

  constructor() {
    this.browser = '', this.renderer = '';
    this.init();
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    this.renderer = new Renderer(this.browser);
  }

  async serialize(url) {
    return await this.renderer.serialize(url);
  }

  close() {
    this.browser.close();
  }
}

module.exports = BrowserRunner;