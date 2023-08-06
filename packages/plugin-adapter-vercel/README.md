# @greenwood/plugin-adapter-vercel

## Overview
Enables usage of Vercel Serverless runtimes for API routes and SSR pages.

> This package assumes you already have `@greenwood/cli` installed.

## Features

This plugin adapts Greenwood [API routes](https://www.greenwoodjs.io/docs/api-routes/) and [SSR pages](https://www.greenwoodjs.io/docs/server-rendering/) into Vercel [Serverless functions](https://vercel.com/docs/concepts/functions/serverless-functions) using their [Build Output API](https://vercel.com/docs/build-output-api/v3).

> _**Note:** You can see a working example of this plugin [here](https://github.com/ProjectEvergreen/greenwood-demo-adapter-vercel)_.


## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-adapter-vercel --save-dev

# yarn
yarn add @greenwood/plugin-adapter-vercel --dev
```


## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginAdapterVercel } from '@greenwood/plugin-adapter-vercel';

export default {
  ...

  plugins: [
    greenwoodPluginAdapterVercel()
  ]
}
```

## Vercel CLI / Local Development

TODO

## Caveats
TODO