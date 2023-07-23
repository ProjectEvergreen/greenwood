---
label: 'Renderer'
menu: side
title: 'Renderer'
index: 5
---

## Renderer

Renderer plugins allow users to customize how Greenwood server renders (and prerenders) your project.  By default, Greenwood supports using [**WCC** or (template) strings](/docs/server-rendering/) to return static HTML for the content and template of your server side routes.  With this plugin for example, you can use [Lit's SSR](https://github.com/lit/lit/tree/main/packages/labs/ssr) to render your Lit Web Components server side instead.

### API

This plugin expects to be given a path to a module that exports a function to execute the SSR content of a page by being given its HTML and related scripts.  For local development Greenwood will run this in a `Worker` thread for live reloading, and use it standalone for production bundling and serving.

```js
const greenwoodPluginMyCustomRenderer = (options = {}) => {
  return {
    type: 'renderer',
    name: 'plugin-renderer-custom',
    provider: () => {
      return {
        executeModuleUrl: new URL('./execute-route-module.js', import.meta.url),
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
- `executeModuleUrl` (recommended) - `URL` to the location of a file with the SSR rendering implementation
- `customUrl` - `URL` to a file that has a `default export` of a function for handling the _prerendering_ lifecyle of a Greenwood build, and running the provided `callback` function
- `prerender` (optional) - Flag can be used to indicate if this custom renderer should be used to statically [prerender](/docs/configuration/#prerender) pages too.

## Examples

### Default

The recommended Greenwood API for executing server rendered code is in a function that is expected to implement any combination of [these APIs](/docs/server-rendering/#api); `default export`, `getBody`, `getTemplate`, and `getFrontmatter`.

You can follow the [WCC default implementation for Greenwood](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/lib/execute-route-module.js) as a reference.

### Custom Implementation

This option is useful for exerting full control over the rendering lifecycle, like running a headless browser.  You can follow [Greenwood's implementation for Puppeteer](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-renderer-puppeteer/src/puppeteer-handler.js) as a reference.