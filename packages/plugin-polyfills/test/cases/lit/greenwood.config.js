import { greenwoodPluginPolyfills } from "../../../src/index.js";

export default {
  plugins: [
    greenwoodPluginPolyfills({
      wc: false,
      lit: true,
    }),
  ],
};
