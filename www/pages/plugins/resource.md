---
label: 'Resource'
menu: side
title: 'Resource'
index: 3
---

## Resource

Resource plugins allow for the manipulation and transformation of files served and bundled by Greenwood.  Whether you need to support a file with a custom extension or transform the contents of a file from one type to the other, resource plugins provide the lifecycle hooks into Greenwood to enable these customizations.  Examples from Greenwood's own plugin system include:
* Minifying and bundling CSS
* Compiling TypeScript into JavaScript
* Converting vanilla CSS into ESM
* Injecting site analytics or other third party snippets into your HTML

It uses standard Web APIs for facilitating these transformations such as [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL), [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), and [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

### API

A [resource "interface"](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/lib/resource-interface.js) has been provided by Greenwood that you can use to start building your own resource plugins with.

```javascript
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ExampleResource extends ResourceInterface {
  constructor(compilation, options = {}) {
    this.compilation = compilation; // Greenwood's compilation object
    this.options = options; // any optional configuration provided by the user of your plugin
    this.extensions = ['foo', 'bar']; // add custom extensions for file watching + live reload here, ex. ts for TypeScript
  }

  // lifecycles go here
}

export function myResourcePlugin(options = {}) {
  return {
    type: 'resource',
    name: 'my-resource-plugin',
    provider: (compilation) => new ExampleResource(compilation, options)
  }
};
```

### Lifecycles
A resource in Greenwood has access to four lifecycles, in this order:
1. `resolve`
1. `serve`
1. `intercept`
1. `optimize` (only runs at build time)

Each lifecycle also supports a predicate like function, e.g. `shouldResolve` that returns a boolean of `true|false` if this plugin's lifecycle should be invoked for this resource.  You can think of these lifecycles effectively as middleware.

#### Resolve

When requesting a file, such as `/main.js`, Greenwood needs to know _where_ this resource is located.  This is the first lifecycle that is run and takes in a `URL` and `Request` as parameters, and should return an of a `Request` object.  Below is an example from [Greenwood's codebase](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/plugins/resource/plugin-user-workspace.js).

<!-- eslint-disable no-unused-vars -->
```js
import fs from 'fs';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class UserWorkspaceResource extends ResourceInterface {
  async shouldResolve(url, request) {
    const { pathname } = url;
    const { userWorkspace } = this.compilation.context;
    const hasExtension = !['', '/'].includes(pathname.split('.').pop());

    return hasExtension
      && !pathname.startsWith('/node_modules')
      && fs.existsSync(new URL(`.${pathname}`, userWorkspace).pathname);
  }

  async resolve(url, request) {
    const { pathname } = url;
    const { userWorkspace } = this.compilation.context;
    const workspaceUrl = new URL(`.${pathname}`, userWorkspace);

    return new Request(workspaceUrl);
  }
}
```
<!-- eslint-enable no-unused-vars -->

> For most cases, you will not need to use this lifecycle as by default Greenwood will first check if it can resolve a request to a file either in the current workspace or _/node_modules/_.  If it finds a match, it will transform the request into a `file://` protocol with the full local path, otherwise the request will remain as the default of `http://`.

#### Serve

When requesting a file, such as `/main.js`, Greenwood needs to return a response so that the contents can be served or bundled appropriately.  This is done by passing an instance of `URL` and `Request` and returning an instance of `Response`.  For example, Greenwood uses this lifecycle extensively to serve all the standard web content types like HTML, JS, CSS, images, fonts, etc and also providing the appropriate `Content-Type` header.  If you are supporting custom extensions, this is where you would transform the contents into something a browser would understand; like compiling from TypeScript to JavaScript.

Below is an example from [Greenwood's codebase](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/plugins/resource/plugin-standard-javascript.js) for serving JavaScript files.

<!-- eslint-disable no-unused-vars -->
```js
import fs from 'fs';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class StandardJavaScriptResource extends ResourceInterface {

  async shouldServe(url, request) {
    return url.protocol === 'file:' && url.pathname.split('.').pop() === 'js';
  }

  async serve(url, request) {
    const body = await fs.promises.readFile(url, 'utf-8');
    
    return new Response(body, {
      headers: {
        'Content-Type': 'text/javascript'
      }
    });
  }
}
```
<!-- eslint-enable no-unused-vars -->

> If this was for a TypeScript file (_.ts_) for example, this would be the lifecycle where you would run `tsc`.

#### Intercept

After the `serve` lifecycle comes the `intercept` lifecycle.  This lifecycle is useful for transforming an already handled resource, or to in anyway augment an already handled response before it is served or bundle.  This can be done by returning an instance of a `Response`.  It takes in as parameters an instance of `URL`, `Request`, and `Response`.

Below is an example from [Greenwood's codebase](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-import-css/src/index.js) for converting a standard CSS file response into ESM so that you can `import` _.css_ files.  You'll see in this example we're return a module instead of just a CSS string, and changing the `Content-Type` of the response to `text/javascript`.

<!-- eslint-disable no-unused-vars -->
```js
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ImportCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
  }

  // ...

  async shouldIntercept(url, request, response) {
    const { pathname } = url;
    const accepts = request.headers.get('accept') || '';
    const notFromBrowser = accepts.indexOf('text/css') < 0 && accepts.indexOf('application/signed-exchange') < 0;

    // https://github.com/ProjectEvergreen/greenwood/issues/492
    return pathname.split('.').pop() === 'css' && 
      (notFromBrowser || url.searchParams.has('type') && url.searchParams.get('type') === 'css');
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const cssInJsBody = `const css = \`${body.replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default css;`;
    
    return new Response(cssInJsBody, {
      headers: new Headers({
        'Content-Type': 'text/javascript'
      })
    });
  }
}
```
<!-- eslint-enable no-unused-vars -->

#### Optimize

This lifecycle is only run during a build and after the `intercept` lifecycle, and as the name implies is a way to do any final production ready optimizations or transformations. It takes as parameters an instance of `URL` and `Response` and should return an instance of `Response`.

Below is an example from [Greenwood's codebase](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-import-css/src/index.js) for minifying CSS.  (The actual function for minifying has been ommitted for brevity)

<!-- eslint-disable no-unused-vars -->
```js
class StandardCssResource extends ResourceInterface {
  async shouldOptimize(url, response) {
    const { protocol, pathname } = url;

    return this.compilation.config.optimization !== 'none'
      && protocol === 'file:'
      && pathname.split('.').pop() === 'css'
      && response.headers.get('Content-Type').indexOf('text/css') >= 0;
  }

  async optimize(url, response) {
    const body = await response.text();
    const optimizedBody = bundleCss(body /* ... */);

    return new Response(optimizedBody);
  }
}
```
<!-- eslint-enable no-unused-vars -->

> _You can see [more in-depth examples of resource plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/plugins/resource/) by reviewing the default plugins maintained in Greenwood's CLI package._