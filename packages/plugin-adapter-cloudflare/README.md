# @greenwood/plugin-adapter-cloudflare

## Overview

Enables usage of [Cloudflare Workers](https://developers.cloudflare.com/workers/) and [Static Assets](https://developers.cloudflare.com/workers/static-assets/) for hosting a Greenwood application. For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Features

This plugin adapts Greenwood [API routes](https://www.greenwoodjs.dev/docs/pages/api-routes/) and [SSR pages](https://www.greenwoodjs.dev/docs/pages/server-rendering/) into a Cloudflare Worker. During `greenwood build`, it generates a `functions/worker.js` entrypoint and copies the route modules and their supporting assets into `functions/`. The generated Worker supports dynamic route segments and forwards unmatched non-API requests to the `ASSETS` binding. Pages using `staticExport` or `getStaticPaths` remain static output in `public/`.

The plugin also generates `public/.assetsignore` to exclude server bundles from Cloudflare's static asset uploads. Those bundles remain in `public/` for Greenwood's local `serve` command, while their copies in `functions/` are deployed as Worker modules. See Cloudflare's [asset exclusion documentation](https://developers.cloudflare.com/workers/static-assets/binding/#ignoring-assets) for more information.

> _**Note:** You can see an example of this plugin in the [Cloudflare adapter demo](https://github.com/ProjectEvergreen/greenwood-demo-adapter-cloudflare) work in progress._

## Installation

You can use your favorite JavaScript package manager to install this package and the Cloudflare CLI, _Wrangler_.

```bash
# npm
$ npm i -D @greenwood/plugin-adapter-cloudflare wrangler

# yarn
$ yarn add @greenwood/plugin-adapter-cloudflare wrangler --dev

# pnpm
$ pnpm add -D @greenwood/plugin-adapter-cloudflare wrangler
```

## Usage

Add this plugin to your _greenwood.config.js_:

```javascript
import { greenwoodPluginAdapterCloudflare } from '@greenwood/plugin-adapter-cloudflare';

export default {
  plugins: [
    greenwoodPluginAdapterCloudflare()
  ]
};
```

Then, create a _wrangler.toml_ file at the root of your project, updating the Worker name for your application. The following configuration follows the Cloudflare adapter demo:

```toml
name = "my-greenwood-app"
main = "./functions/worker.js"
compatibility_date = "2026-10-03" # this should be set to the date of your project's creation
compatibility_flags = ["new_module_registry"]
no_bundle = true

[[rules]]
type = "ESModule"
globs = ["**/*.js"]
fallthrough = true

[assets]
directory = "./public"
binding = "ASSETS"
```

Notes:
- Make sure to enable the [`new_module_registry` compatibility flag](https://blog.cloudflare.com/workers-module-registry-nodejs/). See [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/) and [Static Assets bindings](https://developers.cloudflare.com/workers/static-assets/binding/) for more information.
- The `no_bundle` setting preserves Greenwood's generated module output / layout
- The `ESModule` rule includes the JavaScript modules under `functions/`
- Add `functions/` to your project's _.gitignore_, since it contains generated build output and is recreated on each build.

### Isolation Mode

Greenwood's isolation mode is supported globally through `isolation: true` in your Greenwood configuration or individually through `export const isolation = true` in an SSR or API route. Isolated routes are packaged as module source strings and run in a fresh [Dynamic Worker](https://developers.cloudflare.com/dynamic-workers/) for each request, keeping route code and custom element registries out of the parent Worker.

> **NOTE:** _Dynamic Workers require a Workers Paid plan, and each isolated request creates a billable Dynamic Worker. See Cloudflare's [Dynamic Workers pricing](https://developers.cloudflare.com/dynamic-workers/pricing/)._

Enable isolation in your _greenwood.config.js_:


```javascript
import { greenwoodPluginAdapterCloudflare } from '@greenwood/plugin-adapter-cloudflare';

export default {
  isolation: true,
  plugins: [greenwoodPluginAdapterCloudflare()]
};
```

Add the following [Worker Loader binding](https://developers.cloudflare.com/dynamic-workers/getting-started/#configure-worker-loader) to _wrangler.toml_:

```toml
[[worker_loaders]]
binding = "GREENWOOD_ISOLATION"
```

To retain forwarded child Worker logs, enable [observability](https://developers.cloudflare.com/dynamic-workers/usage/observability/) on the parent Worker:

```toml
[observability]
enabled = true
```

If you use Wrangler deploy previews, configure the binding separately for previews:

```toml
[previews]

[[previews.worker_loaders]]
binding = "GREENWOOD_ISOLATION"

[previews.observability]
enabled = true

[previews.observability.logs]
enabled = true
invocation_logs = true
persist = true
```

The adapter forwards child Worker logs and exceptions to the parent Worker's observability, tagged with the request's route. Static assets are made available to child Workers through an RPC wrapper around the parent's `ASSETS` binding.

### Options

These options configure the generated isolated route Workers. If you override them, match the compatibility settings in your _wrangler.toml_:

| Option | Default | Description |
| --- | --- | --- |
| `compatibilityDate` | `"2026-10-03"` | Compatibility date for isolated Workers. |
| `compatibilityFlags` | `["new_module_registry"]` | Compatibility flags for isolated Workers. |

```javascript
import { greenwoodPluginAdapterCloudflare } from '@greenwood/plugin-adapter-cloudflare';

greenwoodPluginAdapterCloudflare({
  compatibilityDate: '2026-10-03',
  compatibilityFlags: ['new_module_registry']
});
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-adapter-cloudflare').CloudflareAdapter} */
```

```ts
import type { CloudflareAdapter, CloudflareAdapterOptions } from '@greenwood/plugin-adapter-cloudflare';
```

## Cloudflare CLI / Local Development

Assuming your project's build script runs `greenwood build`, preview the production build in the Cloudflare Workers runtime with:

```sh
npm run build
npx wrangler dev
```

> You can continue to use `greenwood develop` and `greenwood serve` for Greenwood's local development workflow.

## Caveats

1. Cloudflare bindings and the execution context are not forwarded to Greenwood route handlers.
