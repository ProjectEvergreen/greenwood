# @greenwood/plugin-import-css

## Overview
A Greenwood plugin to allow you use ESM (`import`) syntax to load your CSS.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-import-css --save-dev

# yarn
yarn add @greenwood/plugin-import-css --dev
```

## Usage
Use this plugin in your _greenwood.config.js_.

```javascript
const pluginImportCss = require('@greenwood/plugin-import-css');

module.exports = {
  ...

  plugins: [
    pluginImportCss()
  ]
}
```

> 👉 _If you are using this along with [**plugin-postcss**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-postcss), make sure **plugin-postcss** comes first.  All non stanrd transformation need to come last._ 


This will then allow you use `import` to include CSS in your JavaScript files.
```js
import cardCss from './card.css';
```