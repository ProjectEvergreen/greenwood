# @greenwood/plugin-adapter-deno-deploy

## Overview

Enables [Deno Deploy](https://deno.com/deploy) hosting for Greenwood static assets, API routes, and SSR pages. For more information about Greenwood, visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Features

The plugin creates a `.deno-deploy/server.js` entrypoint during `greenwood build`. It imports Greenwood's built API routes and dynamic SSR pages, then serves files from `public/` for other non-API requests. The entrypoint is needed when you choose Deno Deploy's **dynamic** runtime. For a site containing only static output, Deno Deploy can serve `public/` directly using its **static** runtime.

> _**Note:** You can see a working example of this plugin [here](https://github.com/ProjectEvergreen/greenwood-demo-adapter-deno-deploy)_.

## Installation

Install the plugin with your preferred package manager.

```sh
# npm
npm i -D @greenwood/plugin-adapter-deno-deploy

# yarn
yarn add @greenwood/plugin-adapter-deno-deploy --dev

# pnpm
pnpm add -D @greenwood/plugin-adapter-deno-deploy
```

## Usage

Add the plugin to _greenwood.config.ts_ (or _.js_)

```ts
import { greenwoodPluginAdapterDenoDeploy } from '@greenwood/plugin-adapter-deno-deploy';
import type { Config } from '@greenwood/cli';

export default {
  plugins: [greenwoodPluginAdapterDenoDeploy()]
} satisfies Config;
```

## Plugin Options

### Serve Static

Controls whether the generated server entrypoint serves `public/` for requests that do not match an API route or SSR page. It does **not** select Deno Deploy's static runtime mode. The default suits a full stack Greenwood site, where the dynamic entrypoint receives asset requests too.

```ts
import { greenwoodPluginAdapterDenoDeploy } from '@greenwood/plugin-adapter-deno-deploy';
import type { Config } from '@greenwood/cli';

export default {
  plugins: [
    greenwoodPluginAdapterDenoDeploy()
  ]
} satisfies Config;
```

> _If you use a frozen `deno.lock` with the default `serveStatic: true` option, build locally, run `deno install --entrypoint .deno-deploy/server.js`, and commit the updated lockfile._

For an API only deployment with no public files to serve, set `serveStatic: false`. Unmatched non-API requests will return 404.

```ts
import { greenwoodPluginAdapterDenoDeploy } from '@greenwood/plugin-adapter-deno-deploy';
import type { Config } from '@greenwood/cli';

export default {
  plugins: [
    greenwoodPluginAdapterDenoDeploy({
      serveStatic: false
    })
  ]
} satisfies Config;
```

## Deploy Configuration

The examples below assume you have committed a `deno.lock` file. If you do not use a lockfile, replace `deno ci` with `deno install`.

> _See [Deno Deploy's build configuration](https://docs.deno.com/deploy/reference/builds/) for more information._

### Dynamic Runtime

For a project with API routes or dynamic SSR pages, configure _deno.jsonc_ for Deno Deploy's **dynamic** runtime mode:

```jsonc
{
  "preferPackageJson": true,
  "deploy": {
    "install": "deno ci",
    "build": "deno task build", // assumes this task calls greenwood build
    "runtime": {
      "type": "dynamic",
      "entrypoint": "./.deno-deploy/server.js",
      "cwd": "."
    }
  }
}
```

> _When combined with `serveStatic: true`, this is the recommended "full-stack" application configuration._

### Static Runtime

For a site with only static output, configure Deno Deploy's static runtime instead:

```jsonc
{
  "preferPackageJson": true,
  "deploy": {
    "install": "deno ci",
    "build": "deno task build",
    "runtime": {
      "type": "static",
      "cwd": "./public"
    }
  }
}
```

## Types

Types are available through the package's exports map and can be referenced explicitly in JavaScript or TypeScript.

```js
/** @type {import('@greenwood/plugin-adapter-deno-deploy').DenoDeployAdapter} */
```

```ts
import type { DenoDeployAdapter, DenoDeployAdapterOptions } from '@greenwood/plugin-adapter-deno-deploy';
```

## Caveats

1. [CSS and bytes import attributes](https://docs.deno.com/runtime/fundamentals/modules/#import-attributes) remain experimental in Deno. If your server side code uses `with { type: 'css' }` or `with { type: 'bytes' }`, verify support in the Deno Deploy runtime. Deno Deploy [does not accept custom runtime flags](https://docs.deno.com/deploy/reference/runtime/), including `--unstable-*` flags.
