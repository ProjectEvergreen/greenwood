---
label: 'build'
menu: side
title: 'Build'
index: 4
linkheadings: 3
---

# Build Configurations

### Webpack

The webpack config for production(`webpack.config.prod.js`) and development(`webpack.config.develop.js`) can be overridden by providing your own custom configuration within your project's directory.  You can eject the default core configurations into your project using greenwood cli [eject](#eject-configuration) command and then edit them after, which is the simplest and recommended method for modifying webpack config.  If you wish to revert back to the default provided configuration, simply delete these 2 files from your project's root directory. 