import { greenwoodPluginImportJsx } from "../../../src/index.js";

export default {
  plugins: [
    greenwoodPluginImportJsx({
      inferredObservability: true,
    }),
  ],
  prerender: true,
};
