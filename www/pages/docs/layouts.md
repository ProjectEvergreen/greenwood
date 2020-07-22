---
label: 'templates'
menu: side
title: 'Templates and Pages'
index: 6
linkheadings: 3
---

## Templates
Greenwood has two types of templates:
- App Template: The [app shell](https://developers.google.com/web/fundamentals/architecture/app-shell) if you will, that wraps all pages.  This is provided for you by Greenwood, but you can override if needed. (though not recommended)
- Page Template:.  Nested within the app template, and how you define different pages / layouts for your site.  Common layouts would be used for a home page, documentation pages, blog posts, etc.


### Page Template
In order to make a page template, you need to create a `LitElement` based custom element that contains a predefined `<entry></entry>` element. The `<entry></entry>` element is where your markdown page content will be placed once compiled. You need to do this in a file within your _templates/_ directory named _<type>-template.js_.

Here is an example `page-template.js` (the [default](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js) one included with Greenwood which is the default page-template.js if no other is defined).  You can just copy / paste this to start your own page template.

```js
import { html, LitElement } from 'lit-element';

class PageTemplate extends LitElement {
  render() {
    return html\`
      <div class='gwd-wrapper'>
        <div class='gwd-page-template gwd-content'>
          <entry></entry>
        </div>
      </div>
    \`;
  }
}

customElements.define('page-template', PageTemplate);
```

> **Note**: the filename must be in the format `<label>-templates.js` and the `customElements` name must be `page-template`.

With a completed page-template.js present in your `src/templates/` folder you can define which page uses it via front-matter at the top of any markdown file.  See [Front Matter Docs](/docs/front-matter#define-template) for more information.  Simply including a file named `page-template.js` will overwrite the greenwood default template for all markdown files, without needing to declare the template at the top of markdown file.

### App Template

In order to make an app template, you need to create a `LitElement` component that contains a predefined hook `MYROUTES` aswell the component element itself **must be defined as `eve-app`**.  You need to do this in a file name and path _`<workspace>`/templates/app-template.js_.

First, we need our app template to use routes, by default greenwood uses [**lit-redux-router**](https://github.com/fernandopasik/lit-redux-router). To do this we define a `<routes></routes>` element in our app-template.js where our routes will be placed when compiled.

Here is an example app-template:

```js
import { html, LitElement } from 'lit-element';

// Add the <routes>-</routes>(without the dash) predefined hook. This is where all your routes will be loaded.
// You may also opt to define a custom 404 route here.
// You must define the app-template with the element name eve-app
class AppComponent extends LitElement {
  render() {
    return html\`
      <routes></routes>
      <lit-route><h1>404 Not found</h1></lit-route>
    \`;
  }
}

customElements.define('eve-app', AppComponent);
```

* `app-template.js` requires MYROUTES predefined hook
* `app-template.js` must have a component name `eve-app`
* `app-template.js` must maintain filename and path `<your-workspace>/templates/app-template.js`

> A working example can be found in the [greenwood source](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js) which is the default _app-template.js_ if no other is defined. A production example can be found in [greenwood's website](https://github.com/ProjectEvergreen/greenwood/blob/master/www/templates/app-template.js).


### Pages
You can create all your pages in a _pages/_ directory in your projects workspace.  You can also create nested pages and the page paths will map accordingly.

For example, given this folder structure:
```shell
.
└── src
    ├── pages
        ├── blog
        │   ├── first-post.md
        │   └── second-post.md
        └── index.md

```

You will have the following page URLs:
- _/_
- _/blog/first-post/_
- _/blog/second-post/_