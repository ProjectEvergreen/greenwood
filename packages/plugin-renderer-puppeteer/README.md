# plugin-renderer-puppeteer

## Overview

A Greenwood plugin for using [**Puppeteer**](https://pptr.dev) as a custom [_prerendering_ solution](https://greenwoodjs.dev/docs/reference/rendering-strategies/#prerendering).  As Puppeteer is a headless browser, it provides a lot more power and capabilities for fully rendering things like Web Components, GraphQL calls, and other very browser dependent features. For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-renderer-puppeteer

# yarn
$ yarn add @greenwood/plugin-renderer-puppeteer --dev

# pnpm
$ pnpm add -D @greenwood/plugin-renderer-puppeteer
```

## Usage

Add this plugin and enable the `prerender` setting in your _greenwood.config.js_:

```javascript
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';

export default {
  prerender: true,

  plugins: [
    greenwoodPluginRendererPuppeteer()
  ]
}
```

Now, when running `greenwood build`, all your pages will get run through Puppeteer and any JavaScript / Web Components that you author will get a one time pass execution and the resulting HTML generated from that process will be captured and further optimized through Greenwood's build pipeline.

### Prerender Concurrency

By default, Greenwood derives the number of pages to generate concurrently from the parallelism available to the runtime.However, as Puppeteer opens a browser page for every route being rendered, in constrained environments such as CI or on lower powered machines, this can lead to instability or even crashes of the Greenwood build process.  To mitigate / fine-tune this, you can override this with the [`concurrency` configuration option](https://greenwoodjs.dev/docs/reference/configuration/#concurrency). 

For example, to generate one page at a time:

```javascript
import { greenwoodPluginRendererPuppeteer } from '@greenwood/plugin-renderer-puppeteer';

export default {
  prerender: true,
  concurrency: 1,
  plugins: [
    greenwoodPluginRendererPuppeteer()
  ]
}
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-renderer-puppeteer').PuppeteerRendererPlugin} */
```

```ts
import type { PuppeteerRendererPlugin } from '@greenwood/plugin-renderer-puppeteer';
```

## Caveats

### Limitations

Given this plugin instruments an entire browser, this plugin _only_ works with Greenwood's [`prerender` configuration](https://greenwoodjs.dev/docs/reference/configuration/#prerender) option and so will NOT be viable for any of Greenwood's [SSR or Serverless](https://greenwoodjs.dev/docs/pages/server-rendering/) capabilities, including `getStaticPaths` / `getStaticProps`.  Instead, Greenwood will be focusing on making [**WCC**](https://github.com/ProjectEvergreen/wcc) the default and recommended first-party solution.

In addition, **puppeteer** also leverages npm `postinstall` scripts which in some environments, like [Stackblitz](https://github.com/ProjectEvergreen/greenwood/discussions/639), would be disabled and so [YMMV](https://dictionary.cambridge.org/us/dictionary/english/ymmv).


### Dependencies

You may need to install additional Operating System level libraries and dependencies depending on the system you are running on to support headless Chrome. For example, for a Docker based environment like [GitHub Actions](https://github.com/ProjectEvergreen/greenwood/blob/master/.github/workflows/ci.yml#L19), you would need to add [this below setup script (or similar)](https://github.com/ProjectEvergreen/greenwood/blob/master/.github/workflows/chromium-lib-install.sh) to your runner.
```shell
#!/usr/bin/bash

set -euo pipefail

puppeteer_cache_dir="$(pwd)/.cache/puppeteer"

# install from locally supplied version by puppeteer,
# along with the system libraries required to run it on Linux
sudo apt-get update
sudo env "PATH=$PATH" PUPPETEER_CACHE_DIR="$puppeteer_cache_dir" \
  ./node_modules/.bin/puppeteer browsers install chrome --install-deps
sudo chown -R "$(id -u):$(id -g)" "$puppeteer_cache_dir"
```

```yml

jobs:
 build:
   runs-on: ubuntu-latest
   steps:
      - uses: actions/checkout@v1
      - name: Install Chromium Library Dependencies
        run: |
         sh path/to/your/chromium-lib-install.sh
      - uses: actions/setup-node@v1
        with:
           node-version: "18.x"

```

See the Puppeteer [Troubleshooting docs](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md) for more info on setting up your specific environment.
