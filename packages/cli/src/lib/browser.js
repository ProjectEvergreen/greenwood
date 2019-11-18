/*
* Rendertron - Modified
* Repo: https://github.com/GoogleChrome/rendertron
* License: Apache 2.0
*/

/**
 * Wraps Puppeteer's interface to Headless Chrome to expose high level rendering
 * APIs that are able to handle web components and PWAs.
 */
const puppeteer = require('puppeteer');

class BrowserRunner {

  constructor() {
    this.browser = {}, this.renderer = {};
    this.init();
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    // this.renderer = new Renderer(this.browser);
  }

  async serialize(requestUrl) {
    const page = await this.browser.newPage();
    let response = null;

    // Page may reload when setting isMobile
    // https://github.com/GoogleChrome/puppeteer/blob/v1.10.0/docs/api.md#pagesetviewportviewport
    page.evaluateOnNewDocument('customElements.forcePolyfill = true');
    page.evaluateOnNewDocument('ShadyDOM = {force: true}');
    page.evaluateOnNewDocument('ShadyCSS = {shimcssproperties: true}');

    await page.setRequestInterception(true);

    // only allow puppeteer to load necessary scripts needed for pre-rendering of the site itself
    page.on('request', interceptedRequest => {
      const interceptedRequestUrl = interceptedRequest.url();

      if (
        interceptedRequestUrl.indexOf('bundle.js') >= 0 || // webpack bundles, webcomponents-bundle.js
        interceptedRequestUrl === requestUrl || // pages / routes
        interceptedRequestUrl.indexOf('localhost:4000') >= 0 // GraphQL server
      ) {
        interceptedRequest.continue();
      } else {
        interceptedRequest.abort();
      }
    });

    // Capture main frame response. This is used in the case that rendering
    // times out, which results in puppeteer throwing an error. This allows us
    // to return a partial response for what was able to be rendered in that
    // time frame.
    page.addListener('response', (r) => {
      if (!response) {
        response = r;
      }
    });

    try {
      // Navigate to page. Wait until there are no oustanding network requests.
      response = await page.goto(requestUrl, { timeout: 10000 });
    } catch (e) {
      console.error(e);
    }

    if (!response) {
      console.error('response does not exist');
      // This should only occur when the page is about:blank. See
      // https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
      return { status: 400, content: '' };
    }

    // Serialize page.
    const content = await page.content();

    await page.close();

    return content;
  }

  close() {
    this.browser.close();
  }
}

module.exports = BrowserRunner;