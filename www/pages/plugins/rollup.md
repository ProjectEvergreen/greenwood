---
label: 'Rollup'
menu: side
title: 'Rollup'
index: 4
---

## Rollup

These plugins allow users to tap into the [Rollup](https://rollupjs.org/) configuration that Greenwood uses to build and optimize the static assets (JS / CSS) of your site when running the `build` command.  Simply use the `provider` method to return an array of rollup plugins.  Easy!

### Example
Install your favorite rollup plugin(s), then create a simple object to provide those plugins to Greenwood.

```javascript
const bannerRollup = require('rollup-plugin-banner');
const packageJson = require('./package.json'); 

module.exports = (options = {}) => {
  const now = new Date().now();

  return [{
    type: 'rollup',
    name: 'plugin-something-something',
    provider: () => [
      banner(`/* ${packageJson.name} v${packageJson.version} - built at ${now}. */`)
    ]
  }];
};
```

> _You can click to see an [example of a rollup plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-import-css), which requires a rollup plugin as part of enabling `import` syntax for CSS files._