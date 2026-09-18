import { greenwoodPluginRendererPuppeteer } from "../../../src/index.js";

export default {
  prerender: true,
  concurrency: 1,
  plugins: [greenwoodPluginRendererPuppeteer()],
};
