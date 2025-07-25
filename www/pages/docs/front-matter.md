---
layout: docs
collection: docs
title: Front Matter
order: 3
tocHeading: 3
---

## Front Matter

"Front matter" is a [YAML](https://yaml.org/) block at the top of any markdown file.  It gives you the ability to define variables that are made available to Greenwood's build process and then your code. You can also use it to `import` additional files.

### Label

By default Greenwood will aim to create a label for your page based on filename and context and include that in the graph.  This can be useful for categorizing or organizing your content when rendering client side, or if you want to create a custom value to display for a link or in your HTML that may be different from what can be inferred from the file name.

#### Example
_pages/blog/2020/03/05/index.md_
```md
---
label: 'My Blog Post from 3/5/2020'
---

```

### Imports
If you want to include files on a _per **page** basis_, you can use the predefined `imports` feature from Greenwood.  This is great for one off use cases where you don't want to ship a third party lib in all your layouts, but just for this one particular page.  This is effectively a naive form of code splitting.  🤓

You can also add attributes by space delimiting them after the path.

#### Example
```md
---
imports:
  - /components/my-component/component.js type="module" foo="bar"
  - /components/my-component/component.css
---
```

You will then see the following emitted for file
```html
<script type="module" src="/components/my-component/component.js" type="module" foo="bar"></script>
<link rel="stylesheet" href="/components/my-component/component.css"/>
```

> _See our [Markdown Docs](/docs/markdown#imports) for more information about rendering custom elements in markdown files._

### Layouts
When creating multiple [page layouts](/docs/layouts/), you can use the `layout` front-matter to configure Greenwood to use that layout for a given page.

#### Example
```md
---
layout: 'home'
---

# Home Page
This is the home page
```

In this example, the _src/layouts/home.html_ will be used to render the current markdown page.

> **Note:** By default, Greenwood will look for and use `src/layouts/page.html` for all pages by default.


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

### Custom Data

You can also pass custom data from your markdown file and that will be made available to Greenwood's [content as data](/docs/data/) or [active frontmatter](/docs/configuration/#active-frontmatter) capabilities.


#### Example
```md
---
author: Jon Doe
date: 04/07/2020'
---

# First Post

My first post
```

Would then be available in the [`data` property](/docs/data/#page-data).

### Active Frontmatter

With [`activeFrontmatter`](/docs/configuration/#active-frontmatter) enabled, any of these properties would be available in your HTML or markdown.
 
```md
---
author: Project Evergreen
---

## My Post

Authored By: ${globalThis.page.data.author}
```