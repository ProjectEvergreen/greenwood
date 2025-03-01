# @greenwood/plugin-typescript

## Overview

A Greenwood plugin for writing [**TypeScript**](https://www.typescriptlang.org/). For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-typescript

# yarn
$ yarn add @greenwood/plugin-typescript --dev

# pnpm
$ pnpm add -D @greenwood/plugin-typescript
```

## Usage

Add this plugin to your _greenwood.config.js_:

```javascript
import { greenwoodPluginTypeScript } from '@greenwood/plugin-typescript';

export default {
  // ...

  plugins: [
    greenwoodPluginTypeScript()
  ]
};
```

Now, you can write some TypeScript!
```ts
import { html, css, LitElement, customElement, property } from 'lit-element';

@customElement('app-greeting')
export class GreetingComponent extends LitElement {
  static styles = css`p { color: blue }`;

  @property()
  name = 'Somebody';

  render() {
    return html`<p>Hello, ${this.name}!</p>`;
  }
}
```

And use it in your project like you would use a _.js_ file!
```html
<script type="module" src="/components/greeting.ts"></script>
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-typescript').TypeScriptPlugin} */
```

```ts
import type { TypeScriptPlugin } from '@greenwood/plugin-typescript';
```

## Options

### Configuration

This plugin provides the following default `compilerOptions`.

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "es2020",
    "moduleResolution": "node",
    "sourceMap": true
  }
}
```

If you would like to extend / override these options:

1. Create your own [_tsconfig.json_](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) with your own `compilerOptions`
    ```json
    {
      "compilerOptions": {
        "experimentalDecorators": true
      }
    }
    ```
1. When adding `greenwoodPluginTypeScript` to your _greenwood.config.js_, enable the `extendConfig` option
    ```js
    import { greenwoodPluginTypeScript } from '@greenwood/plugin-typescript';

    export default {
      // ...

      plugins: [
        greenwoodPluginTypeScript({
          extendConfig: true
        })
      ]
    };
    ```

This will then process your JavaScript with TypeScript with the additional configuration settings you provide.  This also allows you to configure the rest of your _tsconfig.json_ to support your project specific IDE and local development environment settings.

### Pages

By default, this plugin extends TypeScript support for processing [SSR pages](https://www.greenwoodjs.dev/docs/pages/server-rendering/) and [API routes](https://www.greenwoodjs.dev/docs/pages/api-routes/).  For this feature, you will need to enable [custom imports](https://www.greenwoodjs.dev/docs/pages/server-rendering/#custom-imports).

If you would like to _disable_ this feature completely, set the `servePage` option to `false`:

```js
import { greenwoodPluginTypeScript } from '@greenwood/plugin-typescript';

export default {
  // ...

  plugins: [
    greenwoodPluginTypeScript({
      servePage: false
    })
  ]
};
```