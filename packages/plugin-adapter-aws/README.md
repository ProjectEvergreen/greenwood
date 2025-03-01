# @greenwood/plugin-adapter-aws

## Overview

Enables usage of [AWS](https://aws.amazon.com/) hosting for API routes and SSR pages.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Features

This plugin "adapts" SSR pages and API routes to be compatible with AWS Lambda and ready to use with IaC (Infrastructure as Code) tools like [**SST**](https://sst.dev/) and [**Architect**](https://arc.codes/).

> _**Note:** You can see a working example of this plugin [here](https://github.com/ProjectEvergreen/greenwood-demo-adapter-aws)_.


## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-adapter-aws

# yarn
$ yarn add @greenwood/plugin-adapter-aws --dev

# pnpm
$ pnpm add -D @greenwood/plugin-adapter-aws
```

## Usage

Add this plugin to your _greenwood.config.js_:

```javascript
import { greenwoodPluginAdapterAws } from '@greenwood/plugin-adapter-aws';

export default {
  // ...

  plugins: [
    greenwoodPluginAdapterAws()
  ]
}
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-adapter-aws').AwsAdapter} */
```

```ts
import type { AwsAdapter } from '@greenwood/plugin-adapter-aws';
```