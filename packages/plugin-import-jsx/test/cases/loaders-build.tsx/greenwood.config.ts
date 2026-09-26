import { greenwoodPluginImportJsx } from "../../../src/index.js";

export default {
  prerender: true,
  staticExport: true,
  plugins: [...greenwoodPluginImportJsx()],
};
