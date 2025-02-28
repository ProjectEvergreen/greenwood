# @greenwood/plugin-import-jsx

## Overview
Enables usage of `import` syntax for loading [JSX rendering Web Components](https://merry-caramel-524e61.netlify.app/docs/#jsx) compatible with [**WCC**](https://github.com/ProjectEvergreen/wcc). For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

_Note: This is _**not**_ React JSX!_

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-import-jsx

# yarn
$ yarn add @greenwood/plugin-import-jsx --dev

# pnpm
$ pnpm add -D @greenwood/plugin-import-jsx
```

## Usage

Add this plugin to your _greenwood.config.js_:

```javascript
import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';

export default {
  // ...

  plugins: [
    greenwoodPluginImportJsx()
  ]
}
```

This will then allow you to use `import` to include [WCC](https://merry-caramel-524e61.netlify.app/docs/#jsx) compatible JSX rendering Web Components:
```js
export default class FooterComponent extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    return (
      <footer>
        <h4>My Blog</h4>
      </footer>
    );
  }
}

customElements.define('app-footer', FooterComponent);
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-import-jsx').ImportJsxPlugin} */
```

```ts
import type { ImportJsxPlugin } from '@greenwood/plugin-import-jsx';
```

### Notes

- For SSR and `prerender` use cases, [follow these steps](/docs/server-rendering/#custom-imports-experimental)
- For client side / browser code specifically, it is recommended to use import attributes syntax, e.g.
  ```js
  import '../path/to/footer.jsx' with { type: 'jsx' };
  ```