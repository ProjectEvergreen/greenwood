---
label: 'configuration'
menu: side
title: 'Configuration'
index: 2
linkheadings: 3
---

## Configuration
These are all the supported configuration options in **Greenwood**, which you can define in a _greenwood.config.js_ file in your project's root directory.

The below is a _greenwood.config.js_ file reflecting default values:
```js
module.exports = {
  devServer: {
    port: 1984,
    host: 'localhost'
  },
  markdown: {
    plugins: [],
    settings: {}
  },
  meta: [],
  mode: 'ssg',
  optimization: 'default',
  plugins: [],
  title: 'My App',
  workspace: 'src'  // assumes process.cwd()
};
```

### Dev Server
Configuration for Greenwood's development server is available using the `devServer` option.
- `port`: Pick a different port when starting the dev server
- `proxy`: A set of paths to match and re-route to other hosts.  Highest specificty should go at the end.

#### Example
```js
module.exports = {
  devServer: {
    port: 8181,
    proxy: {
      '/api': 'https://stage.myapp.com',
      '/api/foo': 'https://foo.otherdomain.net'
    }
  }
}
```

### Markdown
You can install and provide custom **unifiedjs** [presets](https://github.com/unifiedjs/unified#preset) and [plugins](https://github.com/unifiedjs/unified#plugin) to further customize and process your markdown past what [Greenwood does by default](https://github.com/ProjectEvergreen/greenwood/blob/release/0.10.0/packages/cli/src/transforms/transform.md.js#L68).  After running an `npm install` you can provide their package names to Greenwood.

#### Example

```js
module.exports = {
  markdown: {
    settings: { commonmark: true },
    plugins: [
      'rehype-slug',
      'rehype-autolink-headings'
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

### Mode

Greenwood provides a couple different "modes" by which you can indicate the type of project your are making:

| Option | Description | Use Cases |
| ------ | ----------- | --------- |
|`ssg` | (_Default_) Generates a pre-rendered statically generated website from [pages and templates](/docs/layouts/)at build time. | Blog, portfolio, anything really! |
|`mpa` | Assumes an `ssg` based site, but additionally adds a client side router to create a _Multi Page Application_. | Any `ssg` based site where content lines up well with templates to help with transition between similar pages, like blogs and documentation sites. |
|`spa` | For building and bundling a _Single Page Application (SPA)_ with client side routing and a [single _index.html_ file](/docs/layouts/#single-page-applications). | Any type of client side only rendered application. |

#### Example
```js
module.exports = {
  mode: 'mpa'
}
```

> _`spa` (Single Page Application) mode coming soon!_


### Optimization

Greenwood provides a number of different ways to send hints to Greenwood as to how JavaScript and CSS tags in your HTML should get loaded by the browser.  Greenwood supplements, and builds up on top of existing [resource "hints" like `preload` and `prefetch`](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content).  These optimization settings are intended to compliment any `mode` setting you may have selected.

| Option | Description | Use Cases |
| ------ | ----------- | --------- |
|`default` | Will add a `<link rel="..." src="..." as="..."></link>` tag for every `<script>` or `<link>` tag in the `<head>` of your HTML using `preload` for styles and `modulepreload` for scripts.  This setting will also minify all your JS and CSS files. | General purpose. |
|`inline` | Using this setting, all your `<script>` and `<link>` tags will get inlined right into your HTML. | For  sites with smaller payloads, this could work best as with inlining, you do so at the expense of long-term caching. |
|`none` | With this setting, _none_ of your JS or CSS will be minified or hinted at all. | The best choice if you want to handle everything yourself through custom [Resource plugins](/plugins/resource/). |
|`static` | Only for `<script>` tags, but this setting will remove `<script>` tags from your HTML. | If your Web Components only need a single render just to emit some static HTML, or are otherwise not dynamic or needed at runtime, this will really speed up your site's performance by dropping uncessary HTTP requests. |

#### Example
```js
module.exports = {
  optimization: 'inline'
}
```

> _These settings are currently expiremental, and more fine grained control and intelligent based defaults will be coming soon!_

### Prerender

By default, [Greenwood pre-renders](/about/how-it-works/) all your _runtime_ JavaScript (Web Components, GraphQL calls, etc) across all your pages and captures the output as part of the final built HTML output.  This means you can have ["static" components](/docs/configuration/#optimization) that can just render once and generate all their initial HTML at build time.  This aims to provide a fully complete HTML document to the user, so even if JavaScript is disabled or something breaks in their browser, the user gets all the initial content.  And from there, progessive enhancement can take over.

_However_, you may not need that, like for a [SPA (Single Page Application)](/docs/configuration#mode).  If you _don't_ want any sort of pre-rendering and just want to render out your markdown / HTML, add this setting to your _greenwood.config.js_ and set it to `false`.

#### Example
```js
module.exports = {
  prerender: false 
}
```

> _**As of now, if you are using [plugin-graphql](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-graphql) you cannot change this setting.**  We are working on improving support for server [side rendering and templating](https://github.com/ProjectEvergreen/greenwood/discussions/576) (with Web Components) as part of our [1.0 release](https://github.com/ProjectEvergreen/greenwood/milestone/3)._

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