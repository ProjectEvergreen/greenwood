---
label: 'configuration'
menu: side
title: 'Configuration'
index: 2
linkheadings: 3
---

## Configuration
These are all the supported configuration options in **Greenwood**, which you can define in a _greenwood.config.js_ file in your project's root directory.

A **greenwood.config.js** file reflecting default values would be:
```js
module.exports = {
  workspace: 'src',  // path.join(process.cwd(), 'src')
  devServer: {
    port: 1984,
    host: 'localhost'
  },
  title: 'My App',
  meta: []
};
```

### Dev Server
Configuration for Greenwood's development server is available using the `devServer` option.
- `port`: Pick a different port when starting the dev server

#### Example
```js
module.exports = {
  devServer: {
    port: 8181
  }
}
```

### Markdown
You can provide custom **unifiedjs** [presets](https://github.com/unifiedjs/unified#preset) and [plugins](https://github.com/unifiedjs/unified#plugin) to further custonmize and process your markdown past what [Greenwood does by default](https://github.com/ProjectEvergreen/greenwood/blob/release/0.10.0/packages/cli/src/transforms/transform.md.js#L68). 

#### Example

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

### Meta
You can use the `meta` option for the configuration of [`<meta>` tags](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/The_head_metadata_in_HTML) within the `<head>` tag of the generated _index.html_ file.  This is especially useful for providing text and images for social sharing and link previews like for Slack, text messages, and social media shares, in particular when using the [Open Graph](https://ogp.me/) set of tags.

#### Example
This is an example of the `meta` configuration for the [Greenwood website](https://github.com/ProjectEvergreen/greenwood/blob/master/greenwood.config.js).

```js
const FAVICON_HREF = '/assets/favicon.ico';
const META_DESCRIPTION = 'A modern and performant static site generator supporting Web Component based development';

module.exports = {
  meta: [
    { name: 'description', content: META_DESCRIPTION },
    { name: 'twitter:site', content: '@PrjEvergreen' },
    { property: 'og:title', content: 'Greenwood' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.greenwoodjs.io' },
    { property: 'og:image', content: 'https://s3.amazonaws.com/hosted.greenwoodjs.io/greenwood-logo.png' },
    { property: 'og:description', content: META_DESCRIPTION },
    { rel: 'shortcut icon', href: FAVICON_HREF },
    { rel: 'icon', href: FAVICON_HREF }
  ]
};
```

Which would be equivalent to:

```html
<meta name="description" content="A modern and performant static site generator supporting Web Component based development">
<meta name="twitter:site" content="@PrjEvergreen">
<meta property="og:title" content="Greenwood">
<meta property="og:type" content="website">
<meta property="og:url" content="https://www.greenwoodjs.io/docs/">
<meta property="og:image" content="https://s3.amazonaws.com/hosted.greenwoodjs.io/greenwood-logo.png">
<meta property="og:description" content="A modern and performant static site generator supporting Web Component based development">
<link rel="shortcut icon" href="/assets/favicon.ico">
<link rel="icon" href="/assets/favicon.ico">
```

### Optimization
> ⛔ [_**Coming Soon!**_](https://github.com/ProjectEvergreen/greenwood/issues/354)

<!-- Greenwood supports a couple different options for how it will generate a production build, depending on how much JavaScript you will need to serve your users.
- **strict** (expiremental, but recommended for basic sites): What you write will only be used to pre-render your application. No JavaScript is shipped at all and will typically yield the best results in regards to performance.
- **spa** (default): This will pre-render your site _and_ also ship a full "SPA" experience for your users.

> _You can learn more about optimizations in our [How It Works](/about/how-it-works) docs._

#### Example
```js
module.exports = {
  optimization: 'spa'
}
```
-->

### Title
A default `<title>` element for all pages can be configured with the `title` option.

#### Example
An example of configuring your app's title:
```js
module.exports = {
  title: 'My Static Site'
}
```

### Workspace
Path to where all your project files will be located.  Using an absolute path is recommended.

#### Example

Setting the workspace path to be the _www/_ folder in the current directory from where Greenwood is being run.

```js
const path = require('path');

module.exports = {
  workspace: path.join(process.cwd(), 'www')
}
```