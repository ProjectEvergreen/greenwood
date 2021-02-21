# @greenwood/plugin-babel

## Overview
A Greenwood plugin for using Babel and applying it to your JavaScript.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-babel --save-dev

# yarn
yarn add @greenwood/plugin-babel --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
const pluginBabel = require('@greenwood/plugin-postcss');

module.exports = {
  ...

  plugins: [
    pluginBabel()
  ]
}
```

Optionally, create a _babel.config.js_ in the root of your project with your own custom plugins / settings that you've installed.
```javascript
module.exports = {
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods'
  ]
};
```


By default, the configuration provided by this plugin is:
```javascript
module.exports = {
  plugins: [
    '@babel/preset-env'
  ]
};
```

This will then process your JavaScript with Babel with the configurated plugins / settings you provide.  