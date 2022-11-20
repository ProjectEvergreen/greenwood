# @greenwood/plugin-import-json

## Overview
A Greenwood plugin to allow you use ESM (`import`) syntax to load your JSON.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-import-json --save-dev

# yarn
yarn add @greenwood/plugin-import-json --dev
```

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.

```javascript
import { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';

export default {
  ...

  plugins: [
    greenwoodPluginImportJson()
  ]
}
```

This will then allow you to use `import` to include JSON in your JavaScript files.
```js
import json from '../path/to/data.json';  // must be a relative path per ESM spec

console.log(json) // { status: 200, message: 'some data' }
```

For client side / browser code, it is recommended to append `?type=json`.
```js
import json from '../path/to/data.json?type=json';
```

> _The plan is to coalesce around [import assertions](https://github.com/ProjectEvergreen/greenwood/issues/923) in time for the v1.0 release so the same standard syntax can be used on the client and the server._