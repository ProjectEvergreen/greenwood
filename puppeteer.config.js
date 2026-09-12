// https://github.com/puppeteer/puppeteer/issues/10388#issuecomment-2323077561
const cacheDir = new URL("./cache/puppeteer", import.meta.url);

/**
 * @type {import("puppeteer").Configuration}
 */
export default {
  // Changes the cache location for Puppeteer.
  cacheDirectory: process.env.CI ? cacheDir.pathname : undefined,
};
