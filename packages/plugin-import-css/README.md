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
import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';

export default {
  ...

  plugins: [
    greenwoodPluginImportCss()
  ]
}
```


This will then allow you to use `import` to include CSS in your JavaScript files.
```js
import css from '../path/to/styles.css';  // must be a relative path per ESM spec

console.log(css) // h1 { color: red }
```

A couple notes:
- For SSR and `prerender` use cases, [follow these steps](/docs/server-rendering/#custom-imports-experimental)
- For client side / browser code specifically, it is recommended to append `?type=css`, e.g.
    ```js
    import css from '../path/to/styles.css?type=css';
    ```

For libraries like Material Web Components, this plugin will [resolve references to _some-file.css_ if the equivalent exists that ends in _.js_ (e.g. _styles.css.js_)](https://github.com/ProjectEvergreen/greenwood/issues/700).

> _The plan is to coalesce around [import assertions](https://github.com/ProjectEvergreen/greenwood/issues/923) in time for the v1.0 release so the same standard syntax can be used on the client and the server._


### PostCSS
If you plan to use PostCSS, then it is recommended to use our [**PostCSS plugin**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-postcss) and make sure **plugin-postcss** comes _before_ this plugin in your _greenwood.config.js_.

```javascript
import { greenwoodPluginPostcss } from '@greenwood/plugin-postcss';
import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';

export default {
  ...

  plugins: [
    greenwoodPluginPostcss(),
    greenwoodPluginImportCss()
  ]
}
```