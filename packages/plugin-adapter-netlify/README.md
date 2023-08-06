# @greenwood/plugin-adapter-netlify

## Overview
Enables usage of Netlify Serverless runtimes for API routes and SSR pages .

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-adapter-netlify --save-dev

# yarn
yarn add @greenwood/plugin-adapter-netlify --dev
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

> **This plugin will then generate the appropriate __redirects_ file to correctly route SSR pages and API routes in Netlify as rewrites automatically.  You can continue to customize your Netlify project using your _netlify.toml_ file as needed.**

## Features
This plugin Transforms Greenwood [API routes](https://www.greenwoodjs.io/docs/api-routes/) and [SSR pages](https://www.greenwoodjs.io/docs/server-rendering/) into Netlify [Serverless functions](https://docs.netlify.com/functions/overview/) using their [custom build](https://docs.netlify.com/functions/deploy/?fn-language=js#custom-build-2) approach

> _**Note:** You can see a working example of this plugin [here](https://github.com/ProjectEvergreen/greenwood-demo-adapter-netlify)_.

## Caveats
1. Edge runtime not supported yet