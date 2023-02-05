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
export default {
  devServer: {
    extensions: [],
    hud: true,
    port: 1984,
    host: 'localhost'
  },
  port: 8080,
  interpolateFrontmatter: false,
  markdown: {
    plugins: [],
    settings: {}
  },
  prerender: false,
  staticRouter: false,
  optimization: 'default',
  plugins: [],
  workspace: 'src', // assumes process.cwd()
  pagesDirectory: 'pages', // e.g. src/pages
  templatesDirectory: 'templates' // e.g. src/templates
};
```

### Dev Server
Configuration for Greenwood's development server is available using the `devServer` option.
- `extensions`: Provide an array of extensions to watch for changes and reload the live server with.  By default, Greenwood will already watch all "standard" web assets (HTML, CSS, JS, etc) it supports by default, as well as any extensions set by [resource plugins](/plugins/resource) you are using in your _greenwood.config.json_.
- `hud`: The HUD option ([_head-up display_](https://en.wikipedia.org/wiki/Head-up_display)) is some additional HTML added to your site's page when Greenwood wants to help provide information to you in the browser.  For example, if your HTML is detected as malformed, which could break the parser.  Set this to `false` if you would like to turn it off.
- `port`: Pick a different port when starting the dev server
- `proxy`: A set of paths to match and re-route to other hosts.  Highest specificity should go at the end.

#### Example
```js
export default {
  devServer: {
    extensions: ['txt', 'rtf'],
    port: 3000,
    proxy: {
      '/api': 'https://stage.myapp.com',
      '/api/foo': 'https://foo.otherdomain.net'
    }
  }
};
```

### Interpolate Frontmatter

To support simple static templating in HTML and markdown pages and templates, the `interpolateFrontmatter` option can be set to `true` to allow the following kinds of simple static substitions using a syntax convention based on JavaScript [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals).

#### Example
Given some frontmatter in a markdown file:
```md
---
template: post
title: Git Explorer
published: 04.07.2020
description: Local git repository viewer
author: Owen Buckley
image: /assets/blog-post-images/git.png
---
```

It can be accessed and substituted statically in either markdown or HTML.

##### Markdown
```md
# My Blog Post

Published: ${globalThis.page.published}

Lorum Ipsum.
```

##### HTML
```html
<html>
  <head>
    <title>My Blog - ${globalThis.page.title}</title>
    <meta name="author" content="${globalThis.page.author}">
    <meta property="og:title" content="My Blog">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://www.myblog.dev">
    <meta property="og:image" content="https://www.myblog.dev/${globalThis.page.image}">
    <meta property="og:description" content="My Blog - ${globalThis.page.description}">
  </head>
  <body>
    ...
  </body>
</html>
```

### Markdown
You can install and provide custom **unifiedjs** [presets](https://github.com/unifiedjs/unified#preset) and [plugins](https://github.com/unifiedjs/unified#plugin) to further customize and process your markdown past what [Greenwood does by default](https://github.com/ProjectEvergreen/greenwood/blob/release/0.10.0/packages/cli/src/transforms/transform.md.js#L68).  After running an `npm install` you can provide their package names to Greenwood.

#### Example

```js
export default {
  markdown: {
    settings: { commonmark: true },
    plugins: [
      'rehype-slug',
      'rehype-autolink-headings'
    ]
  }
};
```

### Optimization

Greenwood provides a number of different ways to send hints to Greenwood as to how JavaScript and CSS tags in your HTML should get loaded by the browser.  Greenwood supplements, and builds up on top of existing [resource "hints" like `preload` and `prefetch`](https://developer.mozilla.org/en-US/docs/Web/HTML/Preloading_content).  These optimization settings are intended to compliment any `mode` setting you may have selected.

| Option | Description | Use Cases |
| ------ | ----------- | --------- |
|`default` | Will add a `<link rel="..." src="..." as="..."></link>` tag for every `<script>` or `<link>` tag in the `<head>` of your HTML using `preload` for styles and `modulepreload` for scripts.  This setting will also minify all your JS and CSS files. | General purpose. |
|`inline` | Using this setting, all your `<script>` and `<link>` tags will get inlined right into your HTML. | For  sites with smaller payloads, this could work best as with inlining, you do so at the expense of long-term caching. |
|`none` | With this setting, _none_ of your JS or CSS will be minified or hinted at all. | The best choice if you want to handle everything yourself through custom [Resource plugins](/plugins/resource/). |
|`static` | Only for `<script>` tags, but this setting will remove `<script>` tags from your HTML. | If your Web Components only need a single render just to emit some static HTML, or are otherwise not dynamic or needed at runtime, this will really speed up your site's performance by dropping unnecessary HTTP requests. |

> _These settings are currently considered experimental.  Additional improvements and considerations include adding [`none` override support](https://github.com/ProjectEvergreen/greenwood/discussions/545#discussioncomment-957320), [SSR + hydration](https://github.com/ProjectEvergreen/greenwood/discussions/576), and [side effect free templates and pages](https://github.com/ProjectEvergreen/greenwood/discussions/644)._

#### Example
```js
export default {
  optimization: 'inline'
};
```

#### Overrides
Additionally, you can apply overrides on a per `<link>` or `<script>` tag basis by adding a custom `data-gwd-opt` attribute to your HTML.  The following is supported for JavaScript and CSS.

```html
<!-- Javascript -->
<script type="module" src="/path/to/file1.js" data-gwd-opt="static"></script>
<script type="module" src="/path/to/file2.js" data-gwd-opt="inline"></script>

<!-- CSS -->
<link rel="stylesheet" href="/path/to/file1.css" data-gwd-opt="inline"/>
```

> _Just be mindful that style encapsulation provided by ShadowDOM (e.g. `:host`) for custom elements will now have their styles inlined in the `<head>` and mixed with all other global styles, and thus may collide and [be susceptible to the cascade](https://github.com/ProjectEvergreen/greenwood/pull/645#issuecomment-873125192) depending on their degree of specificity.  Increasing specificity of selectors or using only global styles will help resolve this._

### Pages Directory

By default the directory Greenwood will use to look for your local content is _pages/_.  It is relative to your [user workspace](/docs/configuration#workspace) setting. (`${userWorkspace}/${pagesDirectory}`)

#### Example
```js
export default {
  pagesDirectory: 'docs' // Greenwood will look for pages at src/docs/
};
```

### Port
Unlike the port option for `devServer` configuration, this option allows you to configure the port that your production server will run on when running `greenwood serve`.

#### Example
```js
export default {
  port: 8181
};
```

### Prerender

When set to `true` [Greenwood will pre-render](/about/how-it-works/) your application using [**WCC**](https://github.com/ProjectEvergreen/wcc) and generate HTML from any Web Components you include in your pages and templates as part of the final static HTML build output.

You can combine this with ["static" components](/docs/configuration/#optimization) so that you can just do single pass rendering of your Web Components and get their output as static HTML and CSS at build time without having to ship any runtime JavaScript!

#### Example
```js
export default {
  prerender: true
};
```

### Static Router

> ⚠️ _This feature is experimental.  Please follow along with [our discussion](https://github.com/ProjectEvergreen/greenwood/discussions/1033) to learn more._

Setting the `staticRouter` option to `true` will add a small router runtime in production for static pages to prevent needing full page reloads when navigation between pages that share a template.  For example, the Greenwood website is entirely static, outputting an HTML file per page however, if you navigate from the _Docs_ page to the _Getting Started_ page, you will notice the site does not require a full page load.  Instead, the router will just swap out the content of the page much like client-side SPA router would.  This technique is similar to how projects like [**pjax**](https://github.com/defunkt/jquery-pjax) and [**Turbolinks**](https://github.com/turbolinks/turbolinks) work, and like what you can see on websites like GitHub.


#### Example

```js
export default {
  staticRouter: true
};
```

### Templates Directory

By default the directory Greenwood will use to look for your templates is _templates/_.  It is relative to your [user workspace](/docs/configuration#workspace) setting. (`${userWorkspace}/${templatesDirectory}`)

#### Example
```js
export default {
  templatesDirectory: 'layouts' // Greenwood will look for templates at src/layouts/
};
```

### Workspace
Path to where all your project files will be located.  Using an absolute path is recommended.

#### Example

Setting the workspace path to be the _www/_ folder in the current directory from where Greenwood is being run.

```js
export default {
  workspace: new URL('./www', import.meta.url)
};
```