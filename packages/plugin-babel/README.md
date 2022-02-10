# @greenwood/plugin-babel

## Overview
A Greenwood plugin for using [**Babel**](https://babeljs.io/) and applying it to your JavaScript.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-babel --save-dev

# yarn
yarn add @greenwood/plugin-babel --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginBabel } from '@greenwood/plugin-babel';

export default {
  ...

  plugins: [
    ...greenwoodPluginBabel() // notice the spread ... !
  ]
}
```

Create a _babel.config.cjs_ in the root of your project with your own custom plugins / settings that you've installed and want to use.

```javascript
module.exports = {
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods'
  ]
};
```

This will then process your JavaScript with Babel using the configured plugins and settings you provide.

> _For now Babel configuration needs to be in CJS.  Will we be adding ESM support soon!_

## Options
This plugin provides a default _babel.config.js_ that includes support for [**@babel/preset-env**](https://babeljs.io/docs/en/babel-preset-env) using [**browserslist**](https://github.com/browserslist/browserslist) with reasonable [default configs](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-babel/src/) for each.

If you would like to use it, either standalone or with your own custom _babel.config.js_, you will need to take the following extra steps:

1. Install `@babel/runtime` and `regenerator-runtime` as direct dependencies of your project
    ```bash
    # npm
    npm install @babel/runtime regenerator-runtime

    # yarn
    yarn add @babel/runtime regenerator-runtime
    ```
1. When adding `greenwoodPluginBabel` to your _greenwood.config.js_, enable the `extendConfig` option
    ```js
    import { greenwoodPluginBabel } from '@greenwood/plugin-babel';

    export default {
      ...

      plugins: [
        // notice the spread ... !
        ...greenwoodPluginBabel({
          extendConfig: true
        })
      ]
    }
    ```

If you have a custom _babel.config.js_, this option will merge its own `presets` and `plugins` in the array ahead of your own (if you have them).