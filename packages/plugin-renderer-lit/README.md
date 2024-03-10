# @greenwood/plugin-renderer-lit

## Overview

A Greenwood plugin for using [**Lit**'s SSR capabilities](https://github.com/lit/lit/tree/main/packages/labs/ssr) as a custom server-side renderer.  Although support is experimental at this time, this plugin also gives the ability to statically render entire pages and layouts to output completely static sites.

_We are still actively working on SSR features and enhancements for Greenwood [as part of our 1.0 release](https://github.com/ProjectEvergreen/greenwood/issues?q=is%3Aissue+is%3Aopen+label%3Assr+milestone%3A1.0) so please feel free to test it out and report your feedback._  🙏

> This package assumes you already have `@greenwood/cli` installed.


## Prerequisite

This packages depends on the Lit package as a `peerDependency`.  This means you must have Lit already installed in your project.  You can install anything following the `3.x` release line.

```sh
# npm
$ npm install lit --dev

# yarn
$ yarn add lit --dev
```

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
npm install @greenwood/plugin-renderer-lit --save-dev

# yarn
yarn add @greenwood/plugin-renderer-lit --dev
```

## Caveats

1. Please familiarize yourself with some of the [caveats](https://lit.dev/docs/ssr/overview/#library-status) called out in the Lit docs, like:
    - Lit SSR [**only** renders into declarative shadow roots](https://github.com/lit/lit/issues/3080#issuecomment-1165158794), so you will have to keep browser support and polyfill usage in mind.
    - At this time, `LitElement` does not support `async` work.  You can follow along with this issue [in the Lit repo](https://github.com/lit/lit/issues/2469).
1. Lit only supports templates on the server side for HTML only generated content, thus Greenwood's `getBody` API must be used.  We would love for [server only components](https://github.com/lit/lit/issues/2469#issuecomment-1759583861) to be a thing though!
1. Lit does not support [`CSSStyleSheet` (aka CSS Modules) in their SSR DOM shim](https://github.com/lit/lit/issues/2631#issuecomment-1065400805).
1. Full hydration support is not available yet.  See [this Greenwood issue](https://github.com/ProjectEvergreen/greenwood/issues/880) to follow along with when it will land.

> See [this repo](https://github.com/thescientist13/greenwood-lit-ssr) for a full demo of isomorphic Lit SSR with SSR pages and API routes deployed to Vercel serverless functions.

## Usage

Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';

export default {
  ...

  plugins: [
    greenwoodPluginRendererLit()
  ]
}
```

Now, you can author [SSR pages](/docs/server-rendering/) using Lit templates and components using Greenwood's [`getBody` API](https://www.greenwoodjs.io/docs/server-rendering/#usage).  The below is an example of generating a template of LitElement based `<app-card>` web components.

```js
// src/pages/products.js
import { html } from 'lit';
import '../components/card.js';

export async function getBody() {
  const products = await getProducts();

  return html`
    ${
      products.map((product, idx) => {
        const { title, thumbnail } = product;

        return html`
          <app-card
            title="${idx + 1}) ${title}"
            thumbnail="${thumbnail}"
          ></app-card>
        `;
      })
    }
  `;
}
```

<<<<<<< HEAD
=======
## Caveats

There are a few considerations to take into account when using a `LitElement` as your page component:
- Lit SSR [**only** renders into declarative shadow roots](https://github.com/lit/lit/issues/3080#issuecomment-1165158794), so you will have to keep browser support and polyfill usage in mind.
- Depending on your use case, SSR bundling may break due to bundle chunking and code splitting by Rollup, which we are [hoping to correct ASAP](https://github.com/ProjectEvergreen/greenwood/issues/1118).
- At this time, `LitElement` does [not support `async` work](https://lit.dev/docs/ssr/overview/#library-status) which makes data fetching in pages a bit of challenge.  You can follow along with this issue [in the Lit repo](https://github.com/lit/lit/issues/2469).

>>>>>>> 82460ea4 (feature/issue 1197 Lit v3 upgrade and SSR fixes and enhancements (#1201))
## Options

### Isolation Mode

By default, this plugin sets `isolation` mode to `true` for all SSR pages.  If you want to override this, just export an `isolation` const.

```js
// src/pages/products.js
export const isolation = false;
```

> _See the [isolation configuration](https://www.greenwoodjs.io/docs/configuration/#isolation) docs for more information._

### Hydration

In order for server-rendered components to become interactive on the client side, Lit's [client-side hydration script](https://lit.dev/docs/ssr/client-usage/#loading-@lit-labsssr-clientlit-element-hydrate-support.js) must be included on the page.  This setting is `true` by default, but if you want to turn it off, you can `export` the **hydration** option from your page with a value of `false`.

```js
// src/pages/products.js
export const hydration = false; // disable Lit hydration scripts for this page
```

### Prerender

The plugin provides a setting that can be used to override Greenwood's [default _prerender_](/docs/configuration/#prerender) implementation which uses [WCC](https://github.com/ProjectEvergreen/wcc), to use Lit instead.

```javascript
import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';

export default {
  ...

  plugins: [
    greenwoodPluginRendererLit({
      prerender: true
    })
  ]
}
```

> _Keep in mind you will need to make sure your Lit Web Components are isomorphic and [properly leveraging `LitElement`'s lifecycles](https://github.com/lit/lit/tree/main/packages/labs/ssr#notes-and-limitations) and browser / Node APIs accordingly for maximum compatibility and portability._