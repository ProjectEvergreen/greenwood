# @greenwood/plugin-polyfills

## Overview
A Greenwood plugin adding support for [Web Component related polyfills](https://github.com/webcomponents/polyfills) for browsers that need support for part of the Web Component spec like **Custom Elements** and **Shadow DOM**.  It uses [feature detection](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs#using-webcomponents-loaderjs) to determine what polyfills are actually needed based on the user's browser, to ensure only the minimum extra code is loaded.  If you are using **Lit@2**, it also loads the needed [_polyfill-support.js_](https://lit.dev/docs/tools/requirements/#polyfills) file.

As of right now, you will likely need this plugin to load additional polyfills if you want to support these browser(s):

- Internet Explorer <= 11
- Mobile Browsers
- Declarative Shadow DOM

For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.  This package assumes you already have `@greenwood/cli` installed.

```bash
# npm
$ npm i -D @greenwood/plugin-polyfills

# yarn
$ yarn add @greenwood/plugin-polyfills --dev

# pnpm
$ pnpm add -D @greenwood/plugin-polyfills
```

## Usage

Use this plugin in your _greenwood.config.js_:

```javascript
import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';

export default {
  // ...

  plugins: [
    greenwoodPluginPolyfills()
  ]
}
```

Now when your project builds for production, you will see a _bundles/_ directory in your output directory, as well as a file called _webcomponents-loader.js_, as well as a `<script>` tag for that file in the  `<head>` of your _index.html_ files.  When a page is loaded, the feature detection capabilities will then load the necessary polyfills to have your project work for a user's given browser.

> Note: we would like to add support for [differential loading](https://github.com/ProjectEvergreen/greenwood/issues/224) to avoid the cost of this for newer browsers.

## Options

This plugin supports the following polyfills and configuration options:
1. [Web Components Loader](https://github.com/webcomponents/polyfills/tree/master/packages/webcomponentsjs#using-webcomponents-loaderjs) - `wc`
1. [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/#polyfill) - `dsd`
1. [Lit](https://lit.dev/docs/tools/requirements/#polyfills) - `lit` (Use this in conjunction with Web Components Loader)

You can adjust either of these default behaviors by providing `true` or `false` for each polyfill type.

```javascript
import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';

export default {
  // ...

  // default values shown here
  plugins: [
    ...greenwoodPluginPolyfills({
      wc: true,
      dsd: false,
      lit: false
    })
  ]
}