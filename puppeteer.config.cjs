// https://github.com/puppeteer/puppeteer/issues/10388#issuecomment-2323077561
const { join } = require("node:path");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: join(__dirname, ".cache", "puppeteer"),
};
