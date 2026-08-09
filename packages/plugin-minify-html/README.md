# @greenwood/plugin-minify-html

## Overview

A Greenwood plugin for minifying your HTML output at build time.  It deliberately sticks to the two transforms that are safe by construction:

- **Strips HTML comments**, preserving comments that frameworks rely on (Lit SSR hydration markers like `<!--lit-part ...-->`) and license style `<!--! ... -->` comments
- **Collapses whitespace runs to a single space** — the same collapsing browsers already perform when rendering — leaving `<pre>`, `<textarea>`, `<script>`, `<style>`, and `<noscript>` content untouched

It does not remove attribute quotes, omit optional tags, or minify inline JavaScript / CSS (Greenwood's bundler already runs [terser](https://github.com/terser/terser) over your scripts).  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-minify-html

# yarn
$ yarn add @greenwood/plugin-minify-html --dev

# pnpm
$ pnpm add -D @greenwood/plugin-minify-html
```

## Usage

Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginMinifyHtml } from '@greenwood/plugin-minify-html';

export default {
  // ...

  plugins: [
    greenwoodPluginMinifyHtml()
  ]
}
```

All pages in your build output will then have comments stripped and whitespace collapsed.  Minification only runs as part of `greenwood build` optimizations; `greenwood develop` output is left as authored.

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-minify-html').MinifyHtmlPlugin} */
```

```ts
import type { MinifyHtmlPlugin } from '@greenwood/plugin-minify-html';
```

## Options

- `ignoreCustomComments` (optional) - An array of `RegExp` patterns tested against each comment's (trimmed) contents; matching comments are kept.  Default is `[/^!/, /^\/?lit-/]`.  Passing your own array replaces the default, so include those patterns if you still want them.

```javascript
import { greenwoodPluginMinifyHtml } from '@greenwood/plugin-minify-html';

export default {
  // ...

  plugins: [
    greenwoodPluginMinifyHtml({
      ignoreCustomComments: [/^!/, /^\/?lit-/, /^KEEP/]
    })
  ]
}
```
