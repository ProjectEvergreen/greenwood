/*
* Test rendered components via puppeteer 
*/

const fs = require('fs');
const puppeteer = require('puppeteer');

module.exports = class RenderTest {

  constructor(debug) {
    this.page = '';
    this.browser = '';
    this.headless = !debug; // debugging tests
  }

  runPuppeteer(filePath) {
    return new Promise(async(resolve, reject) => {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        this.browser = await puppeteer.launch({
          headless: this.headless,
          args: ['--no-sandbox']
        });
        this.page = await this.browser.newPage();
        await this.page.setContent(content);

        resolve();

      } catch (err) {
        reject(err);
      }
    });
  }

  async getPuppeteerSelectorAndStyle(selector) {
    return await this.page.$eval(selector, el => JSON.parse(JSON.stringify(getComputedStyle(el))));
  }

  async closePuppeteer() {
    await this.browser.close();
  }
};