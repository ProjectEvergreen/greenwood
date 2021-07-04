# @greenwood/plugin-typescript

## Overview
A Greenwood plugin for writing [**TypeScript**](https://www.typescriptlang.org/).

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-typescript --save-dev

# yarn
yarn add @greenwood/plugin-typescript --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
const pluginTypeScript = require('@greenwood/plugin-typescript');

module.exports = {
  ...

  plugins: [
    ...pluginTypeScript() // notice the spread ... !
  ]
}
```

Then, you can write some TypeScript
```ts
import { html, css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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

## Options
This plugin provides the following default `compilerOptions` in a _tsconfig.json_.

```json
{
  "compilerOptions": {
    "target": "es2020",
    "module": "es2020",
    "moduleResolution": "node"
  }
} 
```

If you would like to extend / override it, you can do as follows:

1. Create your own _tsconfig.json_
    ```json
    {
      "compilerOptions": {
        "expirementalDecorators": true
      }
    }
    ```
1. When adding `pluginTypeScript` to your _greenwood.config.js_, enable the `extendConfig` option
    ```js
    const pluginTypeScript = require('@greenwood/plugin-typescript');

    module.exports = {
      ...

      plugins: [
        // notice the spread ... !
        ...pluginTypeScript({
          extendConfig: true
        })
      ]
    }
    ```

This will then process your JavaScript with TypeScript with the configurated settings you provide.  