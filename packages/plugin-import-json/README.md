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
    ...greenwoodPluginImportJson() // notice the spread ... !
  ]
}
```

This will then allow you use `import` to include JSON in your JavaScript files by appending `?type=json` to the end of the `import` statement.

```js
// { status: 200, message: 'some data' }
import json from '../path/to/data.json?type=json';  // must be a relative path per ESM spec

console.log(json.status) // 200
```