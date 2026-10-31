import { greenwoodPluginAdapterCloudflare } from "../../../src/index.js";

export default {
  basePath: "/my-app",
  plugins: [
    greenwoodPluginAdapterCloudflare({
      wrangler: {
        compatibilityDate: "2026-10-01",
        compatibilityFlags: ["new_module_registry", "nodejs_compat"],
      },
    }),
  ],
};
