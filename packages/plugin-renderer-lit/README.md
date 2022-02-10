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

Now, you can write some [SSR routes](/docs/server-rendering/) using Lit!  The below example even uses the standard [SimpleGreeting](https://lit.dev/playground/) component from the Lit docs.
```js
import fetch from 'node-fetch';
import { html } from 'lit';
import '../components/greeting.js';

async function getBody() {
  const artists = await fetch('http://www.mydomain.com/api/artists').then(resp => resp.json());

  return html`
    <h1>Lit SSR response</h1>
    <table>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Description</th>
        <th>Message</th>
        <th>Picture</th>
      </tr>
      ${
        artists.map((artist) => {
          const { id, name, bio, imageUrl } = artist;

          return html`
            <tr>
              <td>${id}</td>
              <td>${name}</td>
              <td>${bio}</td>
              <td>
                <a href="http://www.mydomain.com/artists/${id}" target="_blank">
                  <simple-greeting .name="${name}"></simple-greeting>
                </a>
              </td>
              <td><img src="${imageUrl}"/></td>
            </tr>
          `;
        })
      }
    </table>
  `;
}

export { getBody };
```

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