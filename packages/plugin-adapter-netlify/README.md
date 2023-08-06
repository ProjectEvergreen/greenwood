# @greenwood/plugin-adapter-netlify

## Overview
Enables usage of Netlify Serverless runtimes for API routes and SSR pages.

> This package assumes you already have `@greenwood/cli` installed.

## Features

This plugin adapts Greenwood [API routes](https://www.greenwoodjs.io/docs/api-routes/) and [SSR pages](https://www.greenwoodjs.io/docs/server-rendering/) into Netlify [Serverless functions](https://docs.netlify.com/functions/overview/) using their [custom build](https://docs.netlify.com/functions/deploy/?fn-language=js#custom-build-2) approach

> _**Note:** You can see a working example of this plugin [here](https://github.com/ProjectEvergreen/greenwood-demo-adapter-netlify)_.


## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-adapter-netlify --save-dev

# yarn
yarn add @greenwood/plugin-adapter-netlify --dev
```


You will then want to create a _netlify.toml_ file at the root of your project (or configure it via the Netlify UI), updating each value as needed per your own project's setup.

```toml
[build]
  publish = "public/"
  command = "npm run build" # or yarn, pnpm, etc

[build.processing]
  skip_processing = true

[build.environment]
  NODE_VERSION = "18.x" # or pin to a specific version, like 18.15.0
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginAdapterNetlify } from '@greenwood/plugin-adapter-netlify';

export default {
  ...

  plugins: [
    greenwoodPluginAdapterNetlify()
  ]
}
```

Optionally, your API routes will have access to Netlify's `context` object as the second parameter to the `handler` function.  For example:
```js
export async function handler(request, context = {}) {
  console.log({ request, context });
}
```

> **This plugin will then generate the appropriate __redirects_ file to correctly route SSR pages and API routes in Netlify as rewrites automatically.  You can continue to customize your Netlify project using your _netlify.toml_ file as needed.**

## Netlify CLI / Local Development

This plugin comes with the Netlify CLI as a dependency to support some local development testing for previewing a Netlify build locally.  Simply add a script like this to your _package.json_
```json
{
  "serve:netlify": "greenwood build && netlify dev"
}
```

Then when you run it, you will be able to run and test a production build of your site locally.

> _Please see caveats section for more information on this feature. 👇_

## Caveats
1. [Edge runtime](https://docs.netlify.com/edge-functions/overview/) is not supported yet.
1. Netlify CLI / Local Dev
    - [`context` object](https://docs.netlify.com/functions/create/?fn-language=js#code-your-function-2) not supported when running `greenwood develop` command
    - [`import.meta.url` is not supported in the Netlify CLI](https://github.com/netlify/cli/issues/4601) and in particular causes [WCC to break]().