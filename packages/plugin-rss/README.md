# @greenwood/plugin-rss

## Overview

A Greenwood plugin for generating an [RSS 2.0](https://www.rssboard.org/rss-specification) feed from the pages in your project.  At build time the feed is written to the output directory (_rss.xml_ by default), and during development it is served from the same route, so `greenwood develop`, `greenwood build`, and `greenwood serve` all expose your feed.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

```bash
# npm
$ npm i -D @greenwood/plugin-rss

# yarn
$ yarn add @greenwood/plugin-rss --dev

# pnpm
$ pnpm add -D @greenwood/plugin-rss
```

## Usage

Use this plugin in your _greenwood.config.js_ and pass in the required channel information for your feed.

```javascript
import { greenwoodPluginRss } from '@greenwood/plugin-rss';

export default {
  // ...

  plugins: [
    greenwoodPluginRss({
      title: 'My Blog',
      link: 'https://www.myblog.dev',
      description: 'Musings on web development'
    })
  ]
}
```

This will generate a feed at `/rss.xml` with one `<item>` per page.  Each item is built from the page's [frontmatter](https://www.greenwoodjs.dev/docs/resources/markdown/#frontmatter):

- `<title>` — the page's `title` (falling back to its inferred label)
- `<link>` / `<guid>` — the `link` option joined with the page's route
- `<description>` — the page's `description` frontmatter, when present
- `<pubDate>` — the page's `published` (or `date`) frontmatter, when present

Pages with a `published` / `date` are sorted newest first.

To scope the feed to just your blog posts, group them into a [collection](https://www.greenwoodjs.dev/docs/content-as-data/collections/) and pass the collection name:

```md
---
collection: blog
title: My First Post
published: 2026-01-15
description: The one where it all began
---

# My First Post
```

```javascript
import { greenwoodPluginRss } from '@greenwood/plugin-rss';

export default {
  plugins: [
    greenwoodPluginRss({
      title: 'My Blog',
      link: 'https://www.myblog.dev',
      description: 'Musings on web development',
      collection: 'blog'
    })
  ]
}
```

You can then advertise the feed from your pages' `<head>`:

```html
<link rel="alternate" type="application/rss+xml" title="My Blog" href="/rss.xml">
```

## Types

Types should automatically be inferred through this package's exports map, but can be referenced explicitly in both JavaScript (JSDoc) and TypeScript files if needed.

```js
/** @type {import('@greenwood/plugin-rss').RssPlugin} */
```

```ts
import type { RssPlugin } from '@greenwood/plugin-rss';
```

## Options

- `title` (required) - The title of your feed
- `link` (required) - The absolute URL of your site, used as the channel link and to build each item's link
- `description` (required) - The description of your feed
- `collection` (optional) - Only include pages from this [collection](https://www.greenwoodjs.dev/docs/content-as-data/collections/).  Default is all pages (excluding the 404 page)
- `filename` (optional) - The output filename of the feed.  Default is `rss.xml`
- `maxItems` (optional) - Cap the number of items in the feed.  Default is unlimited
