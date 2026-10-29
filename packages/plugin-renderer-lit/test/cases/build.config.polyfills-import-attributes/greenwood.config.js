import { greenwoodPluginRendererLit } from "../../../src/index.js";

export default {
  polyfills: {
    importAttributes: ["css"],
  },
  plugins: [greenwoodPluginRendererLit()],
};
