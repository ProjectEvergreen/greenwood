# @greenwood/plugin-css-modules

## Overview

A Greenwood plugin for authoring [**CSS Modules ™️**](https://github.com/css-modules/css-modules).  It is a modest implementation of [the specification](https://github.com/css-modules/icss).  🙂

This is NOT to be confused with [CSS Module _Scripts_](https://web.dev/articles/css-module-scripts), which Greenwood already supports.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-css-modules

# yarn
$ yarn add @greenwood/plugin-css-modules --dev

# pnpm
$ pnpm add -D @greenwood/plugin-css-modules
```

## Usage

Add this plugin to your _greenwood.config.js_:

```javascript
import { greenwoodPluginCssModules } from '@greenwood/plugin-css-modules';

export default {
  // ...

  plugins: [
    greenwoodPluginCssModules()
  ]
}
```

Now you can create a CSS file that ends in _.module.css_:

```css
/* header.module.css */
.container {
  display: flex;
  justify-content: space-between;
}

.navBarMenu {
  border: 1px solid #020202;
}

.navBarMenuItem {
  & a {
    text-decoration: none;
    color: #020202;
  }
}

@media screen and (min-width: 768px) {
  .container {
    padding: 10px 20px;
  }
}
```


And reference that in your (Light DOM) HTML based Web Component:

```js
// header.js
import styles from './header.module.css';

export default class Header extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="${styles.container}">
        <ul class="${styles.navBarMenu}">
          <li class="${styles.navBarMenuItem}">
            <a href="/about/" title="Documentation">About</a>
          </li>
          <li class="${styles.navBarMenuItem}">
            <a href="/contact/" title="Guides">Contact</a>
          </li>
        </ul>
      </header>
    `;
  }
}

customElements.define('app-header', Header);
```

From there, Greenwood will scope your CSS by prefixing with the filename and a hash, and inline that into a `<style>` tag in the HTML and strip the reference to the _module.css_ file from your JavaScript file.

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-css-modules').CssModulesPlugin} */
```

```ts
import type { CssModulesPlugin } from '@greenwood/plugin-css-modules';
```

To support typing of `.module.css` imports, you can add this type definition to your project:

```ts
declare module "*.module.css" {
  const styles: Readonly<Record<string, string>>;
  export default styles;
}
```

## Caveats

> This plugin aims to cover a representative majority of the specification, though if you find missing capabilities please consider submitting an issue and / or PR!

There are some caveats to consider when using this plugin:

1. This plugin only supports usage of CSS Modules within vanilla JavaScript, or [TypeScript (_.ts_)](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-typescript) and [JSX (_.jsx_)](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-import-jsx) when combined with our plugins
1. This plugin only checks for [lower camelCase](https://github.com/css-modules/css-modules/blob/master/docs/naming.md) based class names
    ```css
    /* works ✅ */
    .navBar { }

    /* does not work 🚫 */
    .nav-bar { }
    ```
1. Destructuring is not supported, so this will not work
    ```js
    import styles from './header.module.css';

    export default class Header extends HTMLElement {
      connectedCallback() {
        const { container } = styles;

      this.innerHTML = `
        <header class="${container}">
          <!-- ... -->
        </header>
      `;
      }
    }

    customElements.define('app-header', Header);
    ```
1. From the spec, [exporting `@value` variables](https://github.com/css-modules/css-modules/blob/master/docs/values-variables.md) is not supported