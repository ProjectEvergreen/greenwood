---
label: 'Resource'
menu: side
title: 'Resource'
index: 2
---

## Resource

Resource plugins allow developers to interact with the request and response lifecycles of files at a variety of different points along the development and build workflow, when running the `develop` and `build` commands.  These lifecycles provide the ability to do things like:
- Integrating Site Analytics (Google, Snowplow) in each generated _index.html_ page
- Introduce additional file types, like TypeScript

### API (Resource Interface)
Although JavaScript is loosely typed, a [resource "interface"](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/lib/resource-interface.js) has been provided by Greenwood that you can use to start building our own resource plugins.  Effectively you have to define two things:
- `extensions`: The file types your plugin will operate on
- `contentType`: A browser compatible contentType to ensure browsers correctly interpret you transformations

```javascript
const fs = require('fs');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class ExampleResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.xyz'];
    this.contentType = 'text/something';
  }

  // test if this plugin should be used to process a given for the browser, ex: `<script type="module" src="index.foo">`
  // return true if url / headers match your plugin's use case
  shouldServe(url, headers) { }

  // actually serve the contents of a url, e.g. convert .foo body -> .js body
  // return body and / or contenType
  async serve(url, headers) { }

  // handle (intercept) an already resolved / served resource
  // return true if url / headers match your plugin's case
  shouldIntercept(url, headers) { }

  // in exchange for a response body, return new respone body 
  async intercept(body, headers) { }

  // access to final index.html contents before final Rollup optimizing step
  // inject tracking scripts here, or BYOA (Bring Your Own AST) if you need more than the contents of the HTML
  shouldOptimze(contents) {}

  // in exchange for file contents, return new file contents 
  async optimize(contents) {}
}

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-example',
    provider: (compilation) => new ExampleResource(compilation, options)
  }
};
```

## Example
Below is an example of turning files that have a _.foo_ extension into JavaScript.

```js
// file.foo
interface User {
  id: number
  firstName: string
  lastName: string
  role: string
}

console.log('hello from file.foo with non standard JavaScript in it.');
```

```js
// plugin-foo.js
const fs = require('fs');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class FooResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    
    this.extensions = ['.foo'];
    this.contentType = 'text/javascript';
  }

  async serve(url) {
    return new Promise(async (resolve, reject) => {
      try {
        let body = await fs.promises.readFile(url, 'utf-8');

        // remove non standard JavaScript usage so browser is happy
        body = body.replace(/interface (.*){(.*)}/s, '');

        // and we can return .foo as .js!
        resolve({
          body,
          contentType: this.contentType
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}

module.exports = (options = {}) => {
  return {
    type: 'resource',
    name: 'plugin-foo',
    provider: (compilation) => new StandardJsonResource(compilation, options)
  }
};

// greenwood.config.js
const pluginFoo = require('./plugin-foo');

module.exports = {

  ...

  plugins: [
    pluginFoo()
  ]

}
```

> _You can see [more in-depth examples of resource plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/plugins/resource/) by reviewing the default plugins maintained in Greenwood's CLI package._