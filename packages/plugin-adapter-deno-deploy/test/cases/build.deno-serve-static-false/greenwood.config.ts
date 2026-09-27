import type { Config } from "@greenwood/cli";
import { greenwoodPluginAdapterDenoDeploy } from "../../../src/index.js";

const config: Config = {
  plugins: [greenwoodPluginAdapterDenoDeploy({ serveStatic: false })],
};

export default config;
