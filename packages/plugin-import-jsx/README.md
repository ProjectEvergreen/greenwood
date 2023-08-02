# @greenwood/plugin-import-jsx

## Overview
Enables usage of `import` syntax for loading [JSX rendering Web Components](https://merry-caramel-524e61.netlify.app/docs/#jsx) compatible with [**WCC**](https://github.com/ProjectEvergreen/wcc).  (This is _**not**_ React JSX!)

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-import-jsx --save-dev

# yarn
yarn add @greenwood/plugin-import-jsx --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';

export default {
  ...

  plugins: [
    greenwoodPluginImportJsx()
  ]
}
```

This will then allow you to use `import` to include [WCC](https://merry-caramel-524e61.netlify.app/docs/#jsx) compatible JSX rendering Web Components.
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

A couple notes:
- For SSR and `prerender` use cases, [follow these steps](/docs/server-rendering/#custom-imports-experimental)
- For client side / browser code specifically, it is recommended to append `?type=jsx`, e.g.
  ```js
  import '../path/to/footer.jsx?type=jsx';
  ```

> _The plan is to coalesce around [import assertions](https://github.com/ProjectEvergreen/greenwood/issues/923) in time for the v1.0 release so the same standard syntax can be used on the client and the server._