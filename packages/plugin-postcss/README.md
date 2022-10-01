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

> 👉 _If you are using this along with [**plugin-import-css**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-import-css), make sure **plugin-postcss** comes first.  All non standard transformations need to come last._

Optionally, to use your own PostCSS configuration, you'll need to create _two (2)_ config files in the root of your project, by which you can provide your own custom plugins / settings that you've installed.
- _postcss.config.js_
- _postcss.config.mjs_

Example
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

## Options
This plugin provides a default _postcss.config.js_ that includes support for [**postcss-preset-env**](https://github.com/csstools/postcss-preset-env) using [**browserslist**](https://github.com/browserslist/browserslist) with reasonable [default configs](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-postcss/src/) for each.

If you would like to use it with your own custom _postcss.config.js_, you will need to enable the `extendConfig` option
```js
import { greenwoodPluginPostcss } from '@greenwood/plugin-postcss';

export default {
  ...

  plugins: [
    greenwoodPluginPostcss({
      extendConfig: true
    })
  ]
}
```

By default, the configuration provided by this plugin is:
```javascript
export default {
  plugins: [
    (await import('postcss-preset-env')).default
  ]
};
```

This will then process your CSS with PostCSS using the configured plugins / settings you provide, merged after the default `plugins` listed above.