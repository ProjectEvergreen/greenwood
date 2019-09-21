# @greenwood/plugin-polyfills

## Overview
> _**NOTE: This package is currently installed by default by Greenwood so you don't need to install it yourself.**_

A composite plugin for Greenwood for adding support for adding Web Component related polyfills for browser that need support for it.  So if you need to support these browsers, you will want to use this plugin:

- Microsoft Edge
- Internet Explorer 11

> See Greenwood's [browser support](https://www.greenwoodjs.io/about/how-it-works#browser-support) and [evergreen build](https://www.greenwoodjs.io/about/how-it-works#evergreen-build) docs for more information on how Greenwood handles browser support out of the box.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-polyfills --save-dev

# yarn
yarn add @greenwood/plugin-polyfills --dev
```

## Usage
Use this plugin in your _greenwood.config.js_.

> As this is a composite plugin, you will need to spread the result.

```javascript
const polyfillsPlugin = require('@greenwood/plugin-polyfills');

module.exports = {
  ...

  plugins: [
    ...polyfillsPlugin()
  ]
}
```

This will then add the necessary Polyfills to have your project work in those browsers.

> Note: we would like to add support for [differntial loading]() to avoid the cost of this for newer browsers.