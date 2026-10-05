import { greenwoodPluginRendererPuppeteer } from "../../../src/index.js";

export default {
  activeContent: true,
  prerender: true,
  concurrency: 2,
  devServer: {
    port: 1990,
  },
  plugins: [greenwoodPluginRendererPuppeteer()],
};
