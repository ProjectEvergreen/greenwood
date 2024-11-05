# @greenwood/plugin-adapter-vercel

## Overview

Enables usage of [Vercel](https://vercel.com/) hosting for API routes and SSR pages.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Features

In addition to publishing a project's static assets to the Vercel's CDN, this plugin adapts Greenwood [API routes](https://www.greenwoodjs.io/docs/api-routes/) and [SSR pages](https://www.greenwoodjs.io/docs/server-rendering/) into Vercel [Serverless functions](https://vercel.com/docs/concepts/functions/serverless-functions) using their [Build Output API](https://vercel.com/docs/build-output-api/v3).

> _**Note:** You can see a working example of this plugin [here](https://github.com/ProjectEvergreen/greenwood-demo-adapter-vercel)_.


## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-adapter-vercel

# yarn
$ yarn add @greenwood/plugin-adapter-vercel --dev

# pnpm
$ pnpm add -D @greenwood/plugin-adapter-vercel
```

You will then want to create a _vercel.json_ file, customized to match your project.  Assuming you have an npm script called `build`:
```json
{
  "scripts": {
    "build": "greenwood build"
  }
}
```

This would be the minimum _vercel.json_ configuration you would need:

```json
{
  "buildCommand": "npm run build"
}
```

## Usage

Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginAdapterVercel } from '@greenwood/plugin-adapter-vercel';

export default {
  // ...

  plugins: [
    greenwoodPluginAdapterVercel()
  ]
}
```

## Caveats
1. [Edge runtime](https://vercel.com/docs/concepts/functions/edge-functions) is not supported ([yet](https://github.com/ProjectEvergreen/greenwood/issues/1141)).
1. The Vercel CLI (`vercel dev`) is not compatible with Build Output v3.
    ```sh
    Error: Detected Build Output v3 from "npm run build", but it is not supported for `vercel dev`. Please set the Development Command in your Project Settings.
    ```