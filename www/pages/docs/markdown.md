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
When rendering code fencing, if you add the word `render` before the language, the included [prismjs](https://prismjs.com/) library will add syntax highlighting.

e.g. use:

```
\`\`\`render js
const hello = "world";

<p>\${hello}</p>
\`\`\`
```

To get the result:


```render js
const hello = "world";

<p>${hello}</p>
```

> See our [website theme](https://github.com/ProjectEvergreen/greenwood/blob/master/www/styles/page.css#L1) for more examples on how to style PrismJS.


### Imports
From within the markdown you can also render components, not just their syntax, by importing them via [front-matter](/docs/front-matter).

#### Example
At the top of a `.md` file add an `import` section to render a component inline to the page itself.  This can be helpful if there are situations where you may want to `import` a component for a specific set of pages, as opposed to through a page or app template.:

```render md
----
imports:
  HelloWorld: '../components/helloworld/helloworld.js'
---

\`\`\`render
<hello text='world'>World</hello>
\`\`\`
```

> See our [component model docs](/docs/component-model) for more information on authoring custom elements / components.  For information on configuring additional page meta data, see our section on [front-matter](/docs/front-matter/).