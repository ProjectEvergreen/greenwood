// shared with another test develop.plugins.context
import { myThemePackPlugin } from './theme-pack-context-plugin.js';

export default {
  plugins: [
    ...myThemePackPlugin()
  ]
};