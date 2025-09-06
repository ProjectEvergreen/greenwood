# @greenwood/plugin-markdown

## Overview

A Greenwood plugin for processing markdown files for pages using the [Unified](https://unifiedjs.com/) ecosystem, which includes [**remark**](https://github.com/remarkjs/remark) and [**rehype**](https://github.com/rehypejs/rehype) based plugins.  For more information and complete docs, please visit [the docs page](https://greenwoodjs.dev/docs/plugins/markdown/).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-markdown

# yarn
$ yarn add @greenwood/plugin-markdown --dev

# pnpm
$ pnpm add -D @greenwood/plugin-markdown
```

## Usage

Use this plugin in your _greenwood.config.js_:

```javascript
import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';

export default {
  // ...

  plugins: [
    greenwoodPluginMarkdown()
  ]
}
```

Now you can start authoring content in markdown!

```sh
src/
  pages/
    index.html
    about.md
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-markdown').MarkdownPlugin} */
```

```ts
import type { MarkdownPlugin } from '@greenwood/plugin-markdown';
```

## Options

### Plugins

You can install **remark** or **rehype** compatible plugins to extend this plugin's markdown rendering and transformation capabilities by passing their names in as an array.

For example, after installing something like **rehype-slug** pass the name as a string when adding the plugin to your Greenwood config file:

```javascript
import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';

export default {
  plugins: [
    greenwoodPluginMarkdown({
      plugins: [
        "rehype-slug"
      ],
    })
  ]
}
```

If you need to pass options to a markdown plugin, you can use object syntax with the plugin name and the options it takes.

```javascript
import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';

export default {
  plugins: [
    greenwoodPluginMarkdown({
      plugins: [
        "rehype-slug",
        {
          name: "rehype-autolink-headings",
          options: {
            behavior: "append"
          },
        },
      ],
    })
  ]
}
```

## Standalone Usage

For cases where you may want to manually process markdown _not_ in your pages directory, but leverage all the logic Greenwood uses to process markdown, you can programmatically call the exported function `processMarkdown`, which has two parameters:
- `contents` - Your markdown as a string
- `plugins` - The same plugins you would pass in as options to the markdown plugin

This function will return the processed markdown as an HTML string.

Here is a basic example:

```js
import fs from "node:fs/promises";
import { processMarkdown } from "@greenwood/plugin-markdown";

const contents = await fs.readFile(new URL('./path/to/your/markdown/file.md', import.meta.url), 'utf-8');
const plugins = [
  "@mapbox/rehype-prism",
  {
    name: "rehype-autolink-headings",
    options: { behavior: "append" },
  },
];

const html = await processMarkdown(contents, plugins);

console.log({ html });
```