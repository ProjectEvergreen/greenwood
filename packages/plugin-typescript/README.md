# @greenwood/plugin-typescript

## Overview
A Greenwood plugin for writing [**TypeScript**](https://www.typescriptlang.org/).   There is still a [little more work](https://github.com/ProjectEvergreen/greenwood/issues/658) we would like to do but this plugin should be suitable for general usage.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/plugin-typescript --save-dev

# yarn
yarn add @greenwood/plugin-typescript --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginTypeScript } from '@greenwood/plugin-typescript';

export default {
  ...

  plugins: [
    ...greenwoodPluginTypeScript() // notice the spread ... !
  ]
}
```

Then, you can write some TypeScript
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

## Options
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
      ...

      plugins: [
        // notice the spread ... !
        ...greenwoodPluginTypeScript({
          extendConfig: true
        })
      ]
    }
    ```

This will then process your JavaScript with TypeScript with the additional configuration settings you provide.  This also allows you to configure the rest of _tsconfig.json_ to support your IDE and local development environment settings.