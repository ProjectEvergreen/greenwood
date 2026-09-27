import type { Config } from "@greenwood/cli";
import { greenwoodPluginAdapterDenoDeploy } from "../../../src/index.js";

const config: Config = {
  basePath: "/my-app",
  plugins: [greenwoodPluginAdapterDenoDeploy()],
};

export default config;
