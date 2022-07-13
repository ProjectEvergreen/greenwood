# plugin-renderer-puppeteer

## Overview

A Greenwood plugin for using [**Puppeteer**](https://pptr.dev) as a custom [pre-rendering solution](/docs/server-rendering/#render-vs-prerender).  As Puppeteer is a headless browser, it provides a lot more power and capabilities for fully rendering things like Web Components Web Components, GraphQL calls, and other very browser dependent features.

### Caveats

Given this plugin instruments an entire browser, this plugin _only_ supports Greenwood's [`prerender` configuration](/docs/configuration/#prerender) option and so will NOT be viable for any [SSR](/docs/server-rendering/) or [Serverless and Edge](https://github.com/ProjectEvergreen/greenwood/discussions/626) features.  Instead, Greenwood will be focusing on making [**WCC**](https://github.com/ProjectEvergreen/wcc) the default and recommended first-party solution.

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
npm install @greenwood/plugin-renderer-puppeteer --save-dev

# yarn
yarn add @greenwood/plugin-renderer-puppeteer --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';

export default {
  ...

  plugins: [
    ...greenwoodPluginRendererPuppeteer() // notice the spread!
  ]
}
```

Now, when running `greenwood build`, all your pages will get run through Puppeteer and any JavaScript / Web Components that you author will get a one time pass execution and the resulting HTML generated from that process will be captured and further optimized through Greenwood's build pipeline.