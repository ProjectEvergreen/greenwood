## Markdown

Greenwood supports the [CommonMark](https://commonmark.org/help/) specification.


### Syntax Highlighting

When rendering code fencing, if you add the word render before the language, [prismjs](https://prismjs.com/) will add syntax highlighting.

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

### Components

From within the markdown, you can also render components, not just their syntax, by importing them via [front-matter](/docs/front-matter).

At the top of a `.md` file add:

```render md
----
imports:
  HelloWorld: '../components/helloworld/helloworld.js'
---
```


Below the front-matter, you can then render the component within html(assuming the component has a defined element name)

```render
<hello text='world'></hello-world>
```

Completed file:


```render md
----
imports:
  HelloWorld: '../components/helloworld/helloworld.js'
---

\`\`\`render
<hello text='world'>World</hello>
\`\`\`
```