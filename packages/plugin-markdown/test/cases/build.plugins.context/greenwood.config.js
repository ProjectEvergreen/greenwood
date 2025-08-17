// shared with another test develop.plugins.context
import { myThemePackPlugin } from "./theme-pack-context-plugin.js";
import { greenwoodPluginMarkdown } from "../../../src/index.js";

export default {
  plugins: [greenwoodPluginMarkdown(), myThemePackPlugin()],
};
