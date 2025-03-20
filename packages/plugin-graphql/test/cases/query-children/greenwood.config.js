import { greenwoodPluginGraphQL } from "../../../src/index.js";
import { greenwoodPluginRendererPuppeteer } from "@greenwood/plugin-renderer-puppeteer";

export default {
  activeContent: true,
  prerender: true,
  plugins: [greenwoodPluginGraphQL(), greenwoodPluginRendererPuppeteer()],
};
