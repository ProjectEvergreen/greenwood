// https://github.com/puppeteer/puppeteer/issues/10388#issuecomment-2323077561
const { join } = require("node:path");
const fs = require("node:fs");

const cacheDir = join(__dirname, ".cache", "puppeteer");

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  cacheDirectory: process.env.CI ? cacheDir : undefined,
  // In CI, use system Chrome to avoid download/cache issues
  executablePath: (() => {
    const systemChromePath = "/usr/bin/google-chrome-unstable";
    if (process.env.CI && fs.existsSync(systemChromePath)) {
      return systemChromePath;
    }
    // For local dev, let Puppeteer manage the browser automatically
    return undefined;
  })(),
};
