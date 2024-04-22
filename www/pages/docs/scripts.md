---
label: 'scripts-and-imports'
menu: side
title: 'Scripts and Imports'
index: 5
linkheadings: 3
---

## Scripts and Imports

**Greenwood** generally does not have any opinion on how you structure your site, aside from the pre-determined _pages/_ and (optional) _templates/_ directories.  It supports all standard files that you can open in a web browser.


### Script Tags
Script tags can be done in any standards compliant way that will work in a browser.  So just as in HTML, you can do anything you need, like below:

```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <script>
      alert('hello');
    </script>

    <script src="/path/to/script.js"></script>
    <script src="https://unpkg.com/...."></script>
  </head>

  <body>
    <!-- content goes here -->
  </body>
  
</html>
```

### Imports

Greenwood also supports (and recommends) usage of ECMAScript Modules (ESM), like in the example below.

```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <script type="module" src="./path/to/script.js"></script>
  </head>

  <body>
    <!-- content goes here -->
  </body>
  
</html>
```

### Import Attributes

[Import Attributes](https://github.com/tc39/proposal-import-attributes) are also supported on the client and on [the server](docs/server-rendering/#custom-imports).  By default automatically handles CSS and JSON modules and for CSS, emits a [`CSSStylesheet`](https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/CSSStyleSheet).

```js
import sheet from './styles.css' with { type: 'css' };
import data from './data.json' with { type: 'json' };

console.log({ sheet, data });
```

Combined with Greenwood's [custom import resource plugins](https://www.greenwoodjs.io/plugins/custom-plugins/) (or your own!), Greenwood can handle loading custom file extensions for the client or the server using ESM for just about anything you could need!

### Extensions and Bare Imports

One important note to consider is that ESM by spec definition, expects a couple important characteristics from an `import` path:
1. It must be a relative path
1. It must have an extension

<!-- eslint-disable no-unused-vars -->
```js
// happy panda
import { Foo } from './foo.js';
```

<!-- eslint-disable no-unused-vars -->
```js
// sad panda
import { Foo } from './foo';
```

However, Greenwood also supports [bare module specifiers](https://lit.dev/docs/v1/tools/build/#bare-module-specifiers) for packages you install with a package manager from **npm**.
<!-- eslint-disable no-unused-vars -->
```js
import { html, LitElement } from 'lit';
```

By [creating an import map for you](/about/how-it-works/#cli), Greenwood knows how resolve these but it will _only_ look in _node_modules_.

As a bonus, Greenwood also auto resolves paths with references to _node_modules_ as well if the path starts with `/node_modules/`
```html
<script type="module">
  import { Foo } from '/node_modules/foo/dist/main.js';

  Foo.something();
</script>
```

----

So the rule of thumb is:
- If it's a package from npm, you can use bare specifiers and no extension
- Otherwise, you will need to use a relative path and the extension