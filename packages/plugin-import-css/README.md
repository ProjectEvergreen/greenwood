# @greenwood/plugin-import-css

## Overview
A Greenwood plugin to allow you use ESM (`import`) syntax to load your CSS.

> This package assumes you already have `@greenwood/cli` installed.

## Caveats

As of now, this transformation is only supported for client side (browser) code and will not run correctly in NodeJS until [support for this is introduced into Greenwood](https://github.com/ProjectEvergreen/greenwood/issues/878), or natively by NodeJS.  This means it will not work when using `prerender` option with WCC.

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
    ...greenwoodPluginImportCss() // notice the spread ... !
  ]
}
```

> 👉 _If you are using this along with [**PostCSS plugin**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-postcss), make sure **plugin-postcss** comes first!  All non standard transformations need to come last._


This will then allow you use `import` to include CSS in your JavaScript files by appending `?type=css` to the end of the `import` statement.
```js
import cardCss from './card.css?type=css'; // must be a relative path per ESM spec
```

> _**Note**: Due to a characteristic of using ESM with CSS, Greenwood will also try and detect `import` usage (without needing `?type=css`), but it is recommended to favor explicitness as much as possible, given this is not a standard.  Also, for projects like Material Web Components, this plugin will [resolve references to _some-file.css_ if the equivalent exists that ends in _.js (e.g. styles.css.js)_](https://github.com/ProjectEvergreen/greenwood/issues/700)._

### CSS @import
If you plan to use [CSS `@import` rules](https://developer.mozilla.org/en-US/docs/Web/CSS/@import) in any of the CSS you load with this plugin, then it is recommended to use our [**PostCSS plugin**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-postcss) and make sure to add the **postcss-import** plugin to your PostCSS config files, so as to avoid [CSS bundling issues in production](https://github.com/ProjectEvergreen/greenwood/discussions/763)_.  ex:
```js
// this plugin already come with @greenwood/cli, so no need to install it!

// postcss.config.mjs
export default {
  plugins: [
    ...

    (await import('postcss-import')).default
  ]
};

// postcss.config.js
module.exports = {
  plugins: [
    ...

    require('postcss-import')
  ]
};
```