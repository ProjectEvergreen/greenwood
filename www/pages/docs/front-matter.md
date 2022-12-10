---
label: 'front-matter'
menu: side
title: 'Front Matter'
index: 3
linkheadings: 3
---

## Front Matter

"Front matter" is a [YAML](https://yaml.org/) block at the top of any markdown file.  It gives you the ability to define variables that are made available to Greenwood's build process and then your code. You can also use it to `import` additional files.

### Element Label

By default Greenwood will aim to create a label for your page based on filename and context and include that in the graph.  This can be useful for categorizing or organizing your content when rendering client side, or if you want to create a custom value to display for a link or in your HTML that may be different from what can be inferred from the file name.

#### Example
_pages/blog/2020/03/05/index.md_
```md
---
label: 'My Blog Post from 3/5/2020'
---

```


### Imports
If you want to include files on a _per **page** basis_, you can use the predefined `imports` feature from Greenwood.  This is great for one off use cases where you don't want to ship a third party lib in all your templates, but just for this one particular page.  This is effectively a naive form of code splitting.  🤓

#### Example
```md
---
imports:
  - /components/my-component/component.js
  - /components/my-component/component.css
---
```

You will then see the following emitted for file
```html
<script type="module" src="/components/my-component/component.js"></script>
<link rel="stylesheet" href="/components/my-component/component.css"/>
```

> _See our [Markdown Docs](/docs/markdown#imports) for more information about rendering custom elements in markdown files._


### Template
When creating multiple [page templates](/docs/layouts/), you can use the `template` front-matter to configure Greenwood to use that template for a given page.

#### Example
```md
---
template: 'home'
---

# Home Page
This is the home page
```

In this example, the _src/templates/home.html_ will be used to render the current markdown page.

> **Note:** By default, Greenwood will look for and use `src/templates/page.html` for all pages by default.


### Title
To set the `<title>` for a given page, you can set the `title` variable.  Otherwise, the `<title>` will be inferred from the file name.

#### Example
```md
---
title: 'My Blog Post'
---

# This is a post
The is a markdown file with title defined in front-matter.
```

In this example, the `<title>` tag will be the `title`.
```html
<title>My Blog Post</title>
```

> Note: If you set `title` from your [configuration file](/docs/configuration#title), the output would be
> ```html
> <title>{ConfigTitle} - My Blog Post</title>
> ```

### Custom Data

You can also pass custom data from your markdown file and extract that from Greenwood's [_graph.json_ via `fetch` or our GraphQL server](/docs/data/).


#### Example
```md
---
author: 'Jon Doe'
date: '04/07/2020'
---
```

You would then need to create a `graph` GraphQL query and use that with Greenwood's built in client to get access to that `data`, plus whatever other fields you might want.
```graphql
query {
  graph {
    data {
      author,
      date
    }
  }
}
```

> See [our docs](/docs/data#internal-sources) on using GraphQL w/Greenwood for more information on querying for data.