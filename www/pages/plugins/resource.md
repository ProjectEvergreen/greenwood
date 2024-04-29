---
label: 'Resource'
menu: side
title: 'Resource'
index: 4
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

A resource plugin in Greenwood has access to four lifecycles, in this order:

1. `resolve` - Where the resource is located, e.g. on disk
1. `serve` - What are the contents of a resource
1. `preIntercept` - transforming the response of a _served_ resource before Greenwood can `intercept` it
1. `intercept` - transforming the response of a _served_ resource
1. `optimize` - transforming the response of resource after `intercept` lifecycle has run (only runs at build time)

Each lifecycle also supports a corresponding predicate function, e.g. `shouldResolve` that should return a boolean of `true|false` if this plugin's lifecycle should be invoked for the given resource.

#### Resolve

When requesting a resource like a file, such as `/main.js`, Greenwood needs to know _where_ this resource is located.  This is the first lifecycle that is run and takes in a `URL` and `Request` as parameters, and should return a `Request` object.  Below is an example from [Greenwood's codebase](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/src/plugins/resource/plugin-user-workspace.js).

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

When requesting a file and after knowing where to resolve it, such as `/path/to/user-workspace/main/scripts/main.js`, Greenwood needs to return the contents of that resource so can be served to a browser or bundled appropriately.  This is done by passing an instance of `URL` and `Request` and returning an instance of `Response`.  For example, Greenwood uses this lifecycle extensively to serve all the standard web content types like HTML, JS, CSS, images, fonts, etc and also providing the appropriate `Content-Type` header.

If you are supporting _non standard_ file formats, like TypeScript (`.ts`) or JSX (`.jsx`), this is where you would want to handle providing the contents of this file transformed into something a browser could understand; like compiling the TypeScript to JavaScript.

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

> If this was a TypeScript file, this would be the lifecycle where you would run `tsc`.

#### Pre Intercept

After the `serve` lifecycle comes the `preIntercept` lifecycle.  This lifecycle is useful for transforming an already served resource _Greenwood_ or any other plugins try and `intercept` it the contents.  It takes in as parameters an instance of `URL`, `Request`, and `Response`.

This lifecycle is useful for augmenting _standard_ web formats prior to Greenwood operating on them.  A good example of this is wanting to run pre-processors like Babel, ESBuild, or PostCSS to "downlevel" non-standard syntax _into_ standard syntax before other plugins can operate on it.

Below is an example of Greenwood's PostCSS plugin using `preIntercept` on CSS files.

<!-- eslint-disable no-unused-vars -->
```js
class PostCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['css'];
    this.contentType = ['text/css'];
  }

  async shouldPreIntercept(url) {
    return url.protocol === 'file:' && url.pathname.split('.').pop() === this.extensions[0];
  }

  async preIntercept(url, request, response) {
    const config = await getConfig(this.compilation, this.options.extendConfig);
    const plugins = config.plugins || [];
    const body = await response.text();
    const css = plugins.length > 0
      ? (await postcss(plugins).process(body, { from: normalizePathnameForWindows(url) })).css
      : body;

    return new Response(css);
  }
}
```
<!-- eslint-enable no-unused-vars -->

#### Intercept

After the `preIntercept` lifecycle comes the `intercept` lifecycle.  This lifecycle is useful for transforming already served resources and returning an instance of a `Response` with the new transformation.  It takes in as parameters an instance of `URL`, `Request`, and `Response`.

This lifecycle is useful for augmenting _standard_ web formats, where Greenwood can handle resolving and serving the standard contents, allowing plugins to handle any one-off transformations.

A good example of this is [Greenwood's "raw" plugin](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-import-raw/src/index.js) which can take a standard web format like CSS, and convert it onto a standard ES Module when a `?type=raw` is added to any `import`, which would be useful for CSS-in-JS use cases, for example:

<!-- eslint-disable no-unused-vars -->
```js
import styles from './hero.css?type=raw';
```
<!-- eslint-enable no-unused-vars -->

<!-- eslint-disable no-unused-vars -->
```js
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

class ImportRawResource extends ResourceInterface {
  async shouldIntercept(url) {
    const { protocol, searchParams } = url;
    const type = searchParams.get('type');

    return protocol === 'file:' && type === 'raw';
  }

  async intercept(url, request, response) {
    const body = await response.text();
    const contents = `const raw = \`${body.replace(/\r?\n|\r/g, ' ').replace(/\\/g, '\\\\')}\`;\nexport default raw;`;

    return new Response(contents, {
      headers: new Headers({
        'Content-Type': 'text/javascript'
      })
    });
  }
}
```
<!-- eslint-enable no-unused-vars -->

#### Optimize

This lifecycle is only run during a build (`greenwood build`) and after the `intercept` lifecycle, and as the name implies is a way to do any final production ready optimizations or transformations. It takes as parameters an instance of `URL` and `Response` and should return an instance of `Response`.

Below is an example from [Greenwood's codebase](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-import-css/src/index.js) for minifying CSS.  (The actual function for minifying has been omitted for brevity)

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