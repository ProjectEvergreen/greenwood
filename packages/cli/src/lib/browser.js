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
    this.browser = {};
    this.renderer = {};
  }

  async init() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
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

    // only allow puppeteer to load necessary (local) scripts needed for pre-rendering of the site itself
    page.on('request', interceptedRequest => {
      const interceptedRequestUrl = interceptedRequest.url();

      if (
        interceptedRequestUrl.indexOf('http://127.0.0.1') >= 0 ||
        interceptedRequestUrl.indexOf('localhost') >= 0 ||
        interceptedRequestUrl.indexOf('unpkg.com') >= 0
      ) {
        interceptedRequest.continue();
      } else {
        // console.warn('aborting request', interceptedRequestUrl);
        interceptedRequest.abort();
      }
    });

    try {
      // Navigate to page. Wait until there are no oustanding network requests.
      // https://pptr.dev/#?product=Puppeteer&version=v1.8.0&show=api-pagegotourl-options
      response = await page.goto(requestUrl, {
        waitUntil: 'networkidle0',
        timeout: 0
      });
    } catch (e) {
      console.error('browser error', e);
    }

    if (!response) {
      console.error('response does not exist');
      // This should only occur when the page is about:blank. See
      // https://github.com/GoogleChrome/puppeteer/blob/v1.5.0/docs/api.md#pagegotourl-options.
      return { status: 400, content: '' };
    }

    // Serialize page.
    const content = await page.content();

    // console.debug('content????', content);

    await page.close();

    return content;
  }

  close() {
    this.browser.close();
  }
}

module.exports = BrowserRunner;