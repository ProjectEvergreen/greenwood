# @greenwood/plugin-postcss

## Overview

A Greenwood plugin for loading [**PostCSS**](https://postcss.org/) configuration and applying it to your CSS.

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-postcss --save-dev

# yarn
yarn add @greenwood/plugin-postcss --dev
```

## Usage

Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';

export default {
  ...

  plugins: [
    greenwoodPluginPostCss()
  ]
}
```

By default, this plugin provides a default _postcss.config.js_ that includes support for [**postcss-preset-env**](https://github.com/csstools/postcss-preset-env) using [**browserslist**](https://github.com/browserslist/browserslist) and [**postcss-import**](https://www.npmjs.com/package/postcss-import).

```javascript
export default {
  plugins: [
    (await import('postcss-import')).default,
    (await import('postcss-preset-env')).default
  ]
};
```

> Note: Greenwood provides the postcss-import behavior out of the box.

## Options

### Configuration

To use your own PostCSS configuration, you'll need to create _two (2)_ config files in the root of your project, by which you can provide your own custom plugins / settings that you've installed.
- _postcss.config.js_
- _postcss.config.mjs_

Example:

```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('postcss-nested')
  ]
};

// postcss.config.mjs
export default {
  plugins: [
    (await import('postcss-nested')).default
  ]
};
```

_Eventually once [PostCSS adds support for ESM configuration files](https://github.com/postcss/postcss-cli/issues/387), then this will drop to only needing one file._

### Extend Config

If you would like to _extend_ the default configuration with your own custom _postcss.config.js_, you can enable the `extendConfig` option of this plugin
```js
import { greenwoodPluginPostcss } from '@greenwood/plugin-postcss';

export default {
  // ...

  plugins: [
    greenwoodPluginPostcss({
      extendConfig: true
    })
  ]
};
```

This will then process your CSS with PostCSS using the configured plugins / settings you provide, merged _after_ the default Greenwood configuration listed above.