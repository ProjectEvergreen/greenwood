# @greenwood/plugin-postcss

## Overview

A Greenwood plugin for loading [**PostCSS**](https://postcss.org/) configuration and applying it to your CSS.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-postcss

# yarn
$ yarn add @greenwood/plugin-postcss --dev

# pnpm
$ pnpm add -D @greenwood/plugin-postcss
```

## Usage

Add this plugin to your _greenwood.config.js_:

```javascript
import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';

export default {
  // ...

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

> Note: Greenwood provides the behavior of postcss-import out of the box.

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDocs) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-postcss').PostCssPlugin} */
```

```ts
import type { PostCssPlugin } from '@greenwood/plugin-postcss';
```

## Options

### Configuration

To use your own PostCSS configuration, you'll want to create your own _postcss.config.js_ (or _.ts_) file at the root of your project, by which you can provide your own [custom plugins and settings](https://github.com/postcss/postcss-cli?tab=readme-ov-file#config).

```js
export default {
  plugins: [
    (await import('postcss-nested')).default
  ]
};
```

### Extend Config

If you would like to _extend_ the default configuration with your own custom _postcss.config.js_, you can enable the `extendConfig` option of this plugin.

```js
import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';

export default {
  // ...

  plugins: [
    greenwoodPluginPostCss({
      extendConfig: true
    })
  ]
};
```

This will then process your CSS with PostCSS using the configured plugins / settings you provide, merged _after_ the default Greenwood configuration listed above.
