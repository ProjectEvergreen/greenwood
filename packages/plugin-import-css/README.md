# @greenwood/plugin-import-css

## Overview
A Greenwood plugin to allow you use ESM (`import`) syntax to load your CSS.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-import-css --save-dev

# yarn
yarn add @greenwood/plugin-import-css --dev
```

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.

```javascript
const pluginImportCss = require('@greenwood/plugin-import-css');

module.exports = {
  ...

  plugins: [
    ...pluginImportCss() // notice the spread ... !
  ]
}
```

> 👉 _If you are using this along with [**plugin-postcss**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-postcss), make sure **plugin-postcss** comes first.  All non standard transformations need to come last._ 


This will then allow you use `import` to include CSS in your JavaScript files by appending `?type=css` to the end of the `import` statement.
```js
import cardCss from './card.css?type=css'; // must be a relative path per ESM spec
```

> _**Note**: Due to a characteristic of using ESM with CSS, Greenwood will also try and detect `import` usage (without needing `?type=css`), but it is recommended to favor explicitness as much as possible, given this is not a standard._