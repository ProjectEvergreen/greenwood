---
label: 'markdown'
menu: side
title: 'Markdown'
index: 4
linkheadings: 3
---

## Markdown
In this section we'll cover some of the Markdown related feature of Greenwood, which by default supports the [CommonMark](https://commonmark.org/help/) specification.

### Syntax Highlighting
When rendering code fencing, if you add the language after the fencing, the included [prismjs](https://prismjs.com/) library will add syntax highlighting.

e.g. use:

````js
\`\`\`js
const hello = "world";

<p>\${hello}</p>
\`\`\`
````

To get the result:

```js
const hello = "world";

<p>\${hello}</p>
```

> **Note:** As demonstrated in the above example, backticks and `\$` characters require `\\` to escape correctly.

> See our [website theme](https://github.com/ProjectEvergreen/greenwood/blob/master/www/styles/page.css#L1) for more examples on how to style PrismJS.


### Imports
From within the markdown you can also render components, not just their syntax, by importing them via [front-matter](/docs/front-matter).

#### Example
At the top of a `.md` file add an `import` section to render a component inline to the page itself.  This can be helpful if there are situations where you may want to `import` a component for a specific set of pages, as opposed to through a page or app template.:

```md
---
imports:
  HelloWorld: '../components/helloworld/helloworld.js'
---

<hello text='world'>World</hello>
```

> See our [component model docs](/docs/component-model) for more information on authoring custom elements / components.  For information on configuring additional page meta data, see our section on [front-matter](/docs/front-matter/).

### Customize markdown
Using your `greenwood.config.js`, within your project's root directory, you can add additional [unifiedjs presets](https://github.com/unifiedjs/unified#preset) and settings to the [wc-markdown-loader](https://github.com/hutchgrant/wc-markdown-loader/blob/master/src/parser.js#L30).

For example:

*greenwood.config.js*
```js
module.exports = {
  markdown: {
    settings: { commonmark: true },
    plugins: [
      require('rehype-slug'),
      require('rehype-autolink-headings')
    ]
  }
}
```

Keep in mind, the point in the chain in which [these configured presets will be inserted](https://github.com/hutchgrant/wc-markdown-loader/blob/master/src/parser.js#L30) is in rehype and ends with converting rehype to html.  Any conversion from rehype to retext must convert first from rehype and end with being converted back to rehype. 
