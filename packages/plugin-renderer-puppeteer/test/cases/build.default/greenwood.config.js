import { greenwoodPluginRendererPuppeteer } from "../../../src/index.js";

export default {
  prerender: true,
  plugins: [greenwoodPluginRendererPuppeteer()],
};
