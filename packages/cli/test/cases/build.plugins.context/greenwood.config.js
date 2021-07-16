const myThemePackPlugin = require('./theme-pack-context-plugin');

module.exports = {
  plugins: [
    ...myThemePackPlugin()
  ]
};