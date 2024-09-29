---
collection: docs
title: Content as Data
label: Content as Data
order: 10
tocHeading: 3
---

## Content as Data

### Overview

Having to repeat things when programming is no fun, and that's why (web) component based development is so useful!  As websites start to grow, there comes a point where being able to have access to the content and structure of your site's layout becomes essential towards maintainability, performance, and scalability.

As an example, if you are developing a blog site, like in our [Getting Started](/getting-started/) guide, having to manually list a couple of blog posts by hand isn't so bad.

```html
<ul>
  <li><a href="/blog/2019/first-post.md">First Post</li></a>
  <li><a href="/blog/2019/second-post.md">Second Post</li></a>
</ul>
```

But what happens over time, when that list grows to 10, 50, 100+ posts?  Imagine maintaining that list each time, over and over again?  Or just remembering to update that list each time you publish a new post?  Not only that, but wouldn't it also be great to sort, search, filter, and organize those posts to make them easier for users to navigate and find?

So instead of a static list, you can do something like this!

```javascript
render() {
  return html`
    <ul>
      ${pages.map((page) => {
        return html`
          <li><a href="${page.route}">${page.title}</a></li>
        `;
      })}
    </ul>
  `;
}
```

To assist with this, Greenwood provides all your content as data, so let's review.

### Pages Data

To get started with, let's review the kind of content you can get as data.  Each page will return data in the following schema:

#### Schema

So for a page at _src/pages/blog/first-post.md_, this is the data you would get back
```md
---
author: Project Evergreen
published: 2024-01-01
---

# First Post

This is my first post.
```

```json
{
  "id": "blog-first-post",
  "title": "First Post",
  "label": "First Post",
  "route": "/blog/first-post/",
  "data": {
    "author": "Project Evergreen",
    "published": "2024-01-01"
  }
}
```

#### Table of Contents

Additionally for markdown pages, you can add a frontmatter property called `tocHeadings` that will read all the HTML heading tags that match that number, and provide a subset of data, useful for generated a table of contents.

Taking our previous example, if we were to configure this for `<h2>` tags
```md
---
author: Project Evergreen
published: 2024-01-01
tocHeading: 2
---

# First Post

This is my first post.

## Overview

Lorum Ipsum

## First Point

Something something...
```

We would get this additional content as data out.

```json
{
  "id": "blog-first-post",
  "title": "First Post",
  "label": "First Post",
  "route": "/blog/first-post/",
  "data": {
    "author": "Project Evergreen",
    "published": "2024-01-01",
    "tocHeading": 2,
    "tableOfContents": [{
      "content": "Overview",
      "slug": "overview"
    }, {
      "content": "First Point",
      "slug": "first-post"
    }]
  }
}
```


#### External Content

Using our [Source plugin](/plugins/source/), just as you can get your content as data _out_ of Greenwood, so can you provide your own sources of content (as data) _to_ Greenwood.  This is great for pulling content from a headless CMS, database, or anything else you can imagine!

### Data Client

To fetch content as data, there are three pre-made APIs you can use, based your needs.

```js
// get turn the entire set of pages as an array
import { getContent } from '@greenwood/cli/src/data/client.js';

const pages = await getContent();

// get content by a collection name
import { getContentByCollection } from '@greenwood/cli/src/data/client.js';

const items = await getContentByCollection('nav');

// get all content under a route (like all blog posts)
import { getContentByRoute } from '@greenwood/cli/src/data/client.js';

const posts = await getContentByCollection('/blog/');
```

### Collections

Collections are a feature in Greenwood by which you can use [front matter](/docs/front-matter/) to group pages that can the be referenced through JavaScript or [`activeFrontmatter`](/docs/configuration/#active-frontmatter).  This can be a useful way to group pages for things like navigation menus based on the content in your pages directory.

#### Usage

To define collections, you can simply add a **collection** property to the frontmatter of any static file, like markdown or HTML.

```md
---
collection: nav
---

# About Page
```

#### Active Frontmatter

With [`activeFrontmatter`](/docs/configuration/#active-frontmatter) enabled, you can then access your collections right from your HTML, like for passing attributes to a custom element.  It will get serialized to JSON for you.

```html
<!-- src/pages/index.html -->
<html>
  <head>
    <title>Home Page</title>
    <script type="module" src="../components/navigation.js"></script>
  </head>

  <body>
    <app-navigation items="${globalThis.collection.nav}">
  </body>
</html>
```

#### Data Client

You can also access this content using our data client.

```js
import { getContentByCollection } from '@greenwood/cli/src/data/client.js';

export default class Navigation extends HTMLElement {
  async connectedCallback() {
    const items = await getContentByCollection('nav');

    this.innerHTML = `
      <nav role="main navigation">
        <ul>
          ${
            items.maps(item => {
              return `
                <li>
                  <a href="${route}">${item.label}</a>
                </li>
              `;
            })
          }
        </ul>
      </nav>
    `;
  }
}
```


### GraphQL

For GraphQL support, please see our [**GraphQL plugin**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-graphql) which in additional to exposing an [Apollo server and playground](https://www.apollographql.com/docs/apollo-server/) locally at `http://localhost:4000`, also provides GraphQL alternatives to our Data Client through a customized (read only) Apollo client based wrapper.

![graphql-playground](/assets/graphql-playground.png)