# @greenwood/plugin-renderer-lit

## Overview

A Greenwood plugin for using [**Lit**'s SSR capabilities](https://github.com/lit/lit/tree/main/packages/labs/ssr) as a custom server-side renderer.  Although support is experimental at this time, this plugin also gives the ability to statically render entire pages and templates (instead of puppeteer) to output completely static sites.

_We are still actively working on SSR features and enhancements for Greenwood [as part of our 1.0 release](https://github.com/ProjectEvergreen/greenwood/issues?q=is%3Aissue+is%3Aopen+label%3Assr+milestone%3A1.0) so please feel free to test it out and report your feedback._  🙏

> This package assumes you already have `@greenwood/cli` installed.


## Prerequisite

This packages depends on the Lit package as a `peerDependency`.  This means you must have Lit already installed in your project.  You can install anything following the `2.x` release line.

```sh
# npm
$ npm install lit --dev

# yarn
$ yarn add lit --dev
```

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
npm install @greenwood/plugin-renderer-lit --save-dev

# yarn
yarn add @greenwood/plugin-renderer-lit --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';

export default {
  ...

  plugins: [
    greenwoodPluginRendererLit()
  ]
}
```

Now, you can write some [SSR routes](/docs/server-rendering/) using Lit including all the [available APIs](docs/server-rendering/#api).  The below example uses the standard [SimpleGreeting](https://lit.dev/playground/) component from the Lit docs by also using a LitElement as the `default export`!
```js
import { html, LitElement } from 'lit';
import './path/to/greeting.js';

export default class ArtistsPage extends LitElement {

  constructor() {
    super();
    this.artists = [{ /* ... */ }];
  }

  render() {
    const { artists } = this;

    return html`
      ${
        artists.map((artist) => {
          const { id, name, imageUrl } = artist;

          return html`
            <a href="/artists/${id}" target="_blank">
              <simple-greeting .name="${name}"></simple-greeting>
            </a>

            <img src="${imageUrl}" loading="lazy"/>

            <br/>
          `;
        })
      }
    `;
  }
}

// for now these are needed for the Lit specific implementations
customElements.define('artists-page', ArtistsPage);
export const tagName = 'artists-page';
```

> **Note**: _Lit SSR [**only** renders into declarative shadow roots](https://github.com/lit/lit/issues/3080#issuecomment-1165158794) so you will have to keep browser support and polyfill usage in mind depending on your use case_.

## Options

### Prerender (experimental)

The plugin provides a setting that can be used to override Greenwood's [default _prerender_](/docs/configuration/#prerender) which is Puppeteer, and to instead use Lit.

```javascript
import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';

export default {
  ...

  plugins: [
    greenwoodPluginRendererLit({
      prerender: true
    })
  ]
}
```

> _Keep in mind you will need to make sure your Lit Web Components are isomorphic and [properly leveraging `LitElement`'s lifecycles](https://github.com/lit/lit/tree/main/packages/labs/ssr#notes-and-limitations) and browser / Node APIs accordingly for maximum compatibility and portability._