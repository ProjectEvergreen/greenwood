// https://github.com/puppeteer/puppeteer/issues/10388#issuecomment-2323077561
import { join } from "node:path";

const cacheDir = join(import.meta.dirname, ".cache", "puppeteer");

/**
 * @type {import("puppeteer").Configuration}
 */
export default {
  // Changes the cache location for Puppeteer.
  cacheDirectory: process.env.CI ? cacheDir : undefined,
};
