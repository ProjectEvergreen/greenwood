---
collection: docs
order: 4
tocHeading: 3
---

## Markdown
In this section we'll cover some of the Markdown related feature of **Greenwood**, which by default supports the [CommonMark](https://commonmark.org/help/) specification and [**unifiedjs**](https://unifiedjs.com/) as the markdown / content framework.

### Imports
From within the markdown you can also render components, not just their syntax, by importing them via [front-matter](/docs/front-matter).


#### Example
At the top of a `.md` file add an [`import` section](/docs/front-matter/) to render a component inline to the page itself.  This can be helpful if there are situations where you may want to `import` a component for a specific set of pages, as opposed to through a page or app layout.

```md
---
imports:
  - /components/counter/counter.js
---

## My Demo Page
<x-counter></x-counter>
```

> See our [component model docs](/docs/component-model) for more information on authoring custom elements / components.  For information on configuring additional page meta data, see our section on [front-matter](/docs/front-matter/).

### Configuration
Using your _greenwood.config.js_ you can have additional [markdown customizations and configurations](/docs/configuration#markdown) using unified presets and plugins.

For example, to add support for [**Prism**](https://prismjs.com/) for syntax highlighting, after installing `@mapbox/rehype-prism` via **npm**, just add following to your config file:

```js
export default {
  // ...

  markdown: {
    settings: { /* whatever you need */ },
    plugins: [
      '@mapbox/rehype-prism'
    ]
  }

};
```

### Syntax Highlighting

Although Greenwood does not provide any syntax highlighting by default, as demonstrated in the section above, it is fairly easy to add something like Prism syntax highlighting to your project. 


Here is an example of how to include a Prism theme from a CSS file into your project, ex:

```css
/* https://prismjs.com/examples.html */
@import url('../../node_modules/prismjs/themes/prism-tomorrow.css');
```

Then if you add [one of the supported language](https://lucidar.me/en/web-dev/list-of-supported-languages-by-prism/) after the fencing **prismjs** will add syntax highlighting to your code fences.

Write the following in your markdown

````md
```js
const hello = 'world';

console.log(hello);
```
````

To get this result:
```jsx
const hello = 'world';

console.log(hello);
```