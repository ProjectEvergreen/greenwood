/*
 * Rendertron - Modified
 * Repo: https://github.com/GoogleChrome/rendertron
 * License: Apache 2.0
 */

/**
 * Wraps Puppeteer's interface to Headless Chrome to expose high level rendering
 * APIs that are able to handle web components and PWAs.
 */
import { launch } from "puppeteer";

class BrowserRunner {
  constructor() {
    this.browser = {};
  }

  async init() {
    this.browser = await launch({
      args: ["--no-sandbox"],
    });
  }

  async serialize(requestUrl) {
    const page = await this.browser.newPage();

    // Page may reload when setting isMobile
    // https://github.com/GoogleChrome/puppeteer/blob/v1.10.0/docs/api.md#pagesetviewportviewport
    await page.evaluateOnNewDocument("customElements.forcePolyfill = true");
    await page.evaluateOnNewDocument("ShadyDOM = {force: true}");
    await page.evaluateOnNewDocument("ShadyCSS = {shimcssproperties: true}");

    // Keep the initial document active and block navigation's during prerendering while still allowing JavaScript to execute
    // https://github.com/ProjectEvergreen/greenwood/issues/1585#issuecomment-5227293583
    await page.evaluateOnNewDocument(`
      if (globalThis.top === globalThis && globalThis.navigation) {
        globalThis.navigation.addEventListener("navigate", (event) => {
          if (!event.destination.sameDocument) {
            event.preventDefault();
          }
        });
      }
    `);

    await page.setCacheEnabled(false); // https://github.com/ProjectEvergreen/greenwood/pull/699
    await page.setRequestInterception(true);

    // only allow puppeteer to load necessary (local) scripts needed for pre-rendering of the site itself
    page.on("request", (interceptedRequest) => {
      const interceptedRequestUrl = interceptedRequest.url();

      if (
        interceptedRequestUrl.indexOf("http://127.0.0.1") >= 0 ||
        interceptedRequestUrl.indexOf("localhost") >= 0
      ) {
        interceptedRequest.continue();
      } else {
        // console.warn('aborting request', interceptedRequestUrl);
        interceptedRequest.abort();
      }
    });

    try {
      // Navigate to page. Wait until there are no outstanding network requests.
      const response = await page.goto(requestUrl, {
        waitUntil: "networkidle0",
        timeout: 0,
      });

      if (!response) {
        throw new Error(`Unable to prerender ${requestUrl}: navigation returned no HTTP response.`);
      }

      return await page.content();
    } finally {
      if (!page.isClosed()) {
        await page.close();
      }
    }
  }

  async close() {
    await this.browser.close();
  }
}

export { BrowserRunner };
