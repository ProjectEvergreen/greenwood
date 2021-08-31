# @greenwood/plugin-postcss

## Overview
A Greenwood plugin for loading [**PostCSS**](https://postcss.org/) configuration and applying it to your CSS.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-postcss --save-dev

# yarn
yarn add @greenwood/plugin-postcss --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
const pluginPostCss = require('@greenwood/plugin-postcss');

module.exports = {
  ...

  plugins: [
    pluginPostCss()
  ]
}
```

> 👉 _If you are using this along with [**plugin-import-css**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-import-css), make sure **plugin-postcss** comes first.  All non stanrd transformation need to come last._ 

Optionally, create a _postcss.config.js_ in the root of your project with your own custom plugins / settings that you've installed.

```javascript
module.exports = {
  plugins: [
    require('postcss-nested')
  ]
};
```


## Options
This plugin provides a default _postcss.config.js_ that includes support for [**postcss-preset-env**](https://github.com/csstools/postcss-preset-env) using [**browserslist**](https://github.com/browserslist/browserslist) with reasonable [default configs](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-postcss/src/) for each.  

If you would like to use it with your own custom _postcss.config.js_, you will need to enable the `extendConfig` option
```js
const pluginPostcss = require('@greenwood/plugin-postcss');

module.exports = {
  ...

  plugins: [
    pluginPostcss({
      extendConfig: true
    })
  ]
}
```

By default, the configuration provided by this plugin is:
```javascript
module.exports = {
  plugins: [
    require('cssnano'), // just for production builds
    require('postcss-preset-env')
  ]
};
```

This will then process your CSS with PostCSS with the configurated plugins / settings you provide, merged after the default `plugins` listed above.