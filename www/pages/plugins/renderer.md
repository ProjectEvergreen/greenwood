---
label: 'Renderer'
menu: side
title: 'Renderer'
index: 4
---

## Renderer

Renderer plugins allow users to customize how Greenwood server renders (and prerenders) your project.  By default, Greenwood just supports using [(template) strings](/docs/server-rendering/) to return static HTML for the content and template of your server side routes.  For example, using [Lit SSR](https://github.com/lit/lit/tree/main/packages/labs/ssr) to render Lit Web Components server side.

### API

Given that rendering Web Components on the server side often involves implementations needing to patch the NodeJS globals space, the Greenwood API for executing server rendered code will need to happen in a [Worker](https://nodejs.org/api/worker_threads.html) thread.  So at a high level, each implementation will need to provide a path to a worker script.

- `workerUrl` (required) - URL to the location of the worker thread to use for SSR
- `prerender` (optional) - If this custom renderer should be used to statically [prerender](/docs/configuration/#prerender) pages too.


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

## Example
As with Greenwood's default server rendering implementation, each worker is expected to implement [the API](/docs/server-rendering/#api) of `getBody`, `getTemplate`, `getFrontmatter`.  You can see how Greenwood implemented this for [our Lit renderer Worker](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-renderer-lit/src/index.js) as a reference.