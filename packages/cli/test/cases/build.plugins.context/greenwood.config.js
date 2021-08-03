// shared with another test develop.plugins.context
const myThemePackPlugin = require('./theme-pack-context-plugin');

module.exports = {
  plugins: [
    ...myThemePackPlugin()
  ]
};