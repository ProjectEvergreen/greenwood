---
label: 'Renderer'
menu: side
title: 'Renderer'
index: 4
---

## Renderer

Renderer plugins allow users to customize how Greenwood server renders (and prerenders) your project.  By default, Greenwood just supports using [(template) strings](/docs/server-rendering/) to return static HTML for the content and template of your server side routes.  For example, using [Lit SSR](https://github.com/lit/lit/tree/main/packages/labs/ssr) to render Lit Web Components server side.

### API

Given that rendering Web Components on the server side often involves implementations needing to patch the NodeJS globals space or more complex needs like running an entire headless browser, Greenwood provides a couple ways to manage the rendering lifecycle.

```js
const greenwoodPluginMyCustomRenderer = (options = {}) => {
  return {
    type: 'renderer',
    name: 'plugin-renderer-custom',
    provider: () => {
      return {
        workerUrl: new URL('./my-ssr-route-worker.js', import.meta.url),
        prerender: options.prerender
      };
    }
  };
};

export {
  greenwoodPluginMyCustomRenderer
};
```

#### Options
- `workerUrl` (recommended) - URL to the location of a file with a worker thread implementation to use for rendering.
- `customUrl` - URL to a file that has a `default export` of a function for handling the _prerendering_ lifecyle of a Greenwood build, and running the provided `callback` function
- `prerender` (optional) - Flag can be used to indicate if this custom renderer should be used to statically [prerender](/docs/configuration/#prerender) pages too.

## Examples

### Workers

The recommended Greenwood API for executing server rendered code is in a [Worker](https://nodejs.org/api/worker_threads.html) thread, to avoid global namespace and API collisions.
Each worker is expected to implement [the API](/docs/server-rendering/#api) of `default export`, `getBody`, `getTemplate`, and `getFrontmatter`.

You can follow the [WCC default implementation for Greenwood](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/lib/ssr-route-worker.js) as a reference.

### Custom Implementation

This option is useful for exerting full control over the rendering lifecycle.  You can follow [Greenwood's implementation for Puppeteer](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-renderer-puppeteer/src/puppeteer-handler.js) as a reference.