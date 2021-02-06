# @greenwood/plugin-postcss

## Overview
A Greenwood plugin for loading PostCSS configuration and applying it to your CSS.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-postcss --save-dev

# yarn
yarn add @greenwood/plugin-postcss --dev
```

## Usage
Use this plugin in your _greenwood.config.js_.

```javascript
const pluginPostCss = require('@greenwood/plugin-postcss');

module.exports = {
  ...

  plugins: [
    pluginPostCss()
  ]
}
```

> 👉 _If you are using this along with [**plugin-import-css**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-import-css), make sure **plugin-postcss** comes first.  All mnon stanrd transformation need to come last._ 

Optionally, create a _postcss.config.js_ in the root of your project with your own custom plugins / settings.
```javascript
// TODO
```


By default, the configuration provided by this plugin is:
```javascript
// TODO
```

This will then process your CSS with PostCSS with the configurated plugins / settings you provide.  