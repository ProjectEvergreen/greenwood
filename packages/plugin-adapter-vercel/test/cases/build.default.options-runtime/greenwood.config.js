import { greenwoodPluginAdapterVercel } from "../../../src/index.js";

export default {
  plugins: [
    greenwoodPluginAdapterVercel({
      runtime: "nodejs22.x",
    }),
  ],
};
