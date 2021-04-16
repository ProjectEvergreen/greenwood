# @greenwood/plugin-import-commonjs

## Overview
A plugin for Greenwood for loading CommonJS based modules (`require` / `module.exports`) in the browser using ESM (`import` / `export`) syntax.  _**Note**: It is highly encouraged that you favor ESM based packages for the cleanest / fastest interop and developer experience.  Additional processing time and dependencies are required to handle the conversion._

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-import-commonjs --save-dev

# yarn
yarn add @greenwood/plugin-import-commonjs --dev
```

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.

```javascript
const pluginImportCommonJs = require('@greenwood/plugin-import-commonjs');

module.exports = {
  ...

  plugins: [
    ...pluginImportCommonJs() // notice the spread ... !
  ]
}
```

This will then allow you to use a CommonJS based modules in the browser.   For example, here is how you could use [**lodash**](https://lodash.com/) (although as mentioend above, in this case, you would want to use [**lodash-es**](https://www.npmjs.com/package/lodash-es) instead.)

```javascript
// <script src="my-file.js">
import _ from 'lodash';

.
.

console.log(_.defaults({ 'a': 1 }, { 'a': 3, 'b': 2 }));  // { 'a': 1, 'b': 2 }
```