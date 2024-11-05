# @greenwood/plugin-import-raw

## Overview

A Greenwood plugin to use ESM (`import`) syntax to load any file contents as a string exported as a JavaScript module.  Inspired by **webpack**'s [raw loader](https://v4.webpack.js.org/loaders/raw-loader/).  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-import-raw

# yarn
$ yarn add @greenwood/plugin-import-raw --dev

# npm
$ pnpm add -D @greenwood/plugin-import-raw
```

## Usage

Add this plugin to your _greenwood.config.js_:

```javascript
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';

export default {
  // ...

  plugins: [
    greenwoodPluginImportRaw()
  ]
}
```

This will then allow you to use ESM (`import`) to include any file as an arbitrary string exported as a JavaScript module.
```js
import css from '../path/to/styles.css?type=raw'; // must be a relative path per ESM spec

console.log(css); // h1 { color: red }
```

> For libraries like Material Web Components, this plugin will [resolve references to _some-file.css_ if the equivalent exists that ends in _.js_ (e.g. _styles.css.js_)](https://github.com/ProjectEvergreen/greenwood/issues/700).

## Options

### Matches

Optionally, you can provide an array of "matcher" patterns for the plugin to transform custom paths, which can be useful for handling imports you can't change, like third party files in _node_modules_.

```javascript
import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';

export default {
  plugins: [
    greenwoodPluginImportRaw({
      matches: [
        '/node_modules/some-package/dist/styles.css'
      ]
    })
  ]
}
```