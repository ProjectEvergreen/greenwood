# @greenwood/plugin-adapter-netlify

## Overview
Enables usage of Netlify Serverless and Edge (coming soon!) runtimes for API routes and SSR pages .

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

## Caveats

TBD