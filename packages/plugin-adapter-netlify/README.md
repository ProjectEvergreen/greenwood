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

## Features
This plugin Transforms Greenwood [API routes](https://www.greenwoodjs.io/docs/api-routes/) and [SSR pages](https://www.greenwoodjs.io/docs/server-rendering/) into Netlify [Serverless functions](https://docs.netlify.com/functions/overview/) using their [custom build](https://docs.netlify.com/functions/deploy/?fn-language=js#custom-build-2) approach

> _**Note:** You can see a working example of this plugin [here](https://github.com/ProjectEvergreen/greenwood-demo-adapter-netlify)_.

## Caveats
1. Edge runtime not supported yet