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
In order to make a page template, you need to create a `LitElement` based custom element that contains a number of pre-defined variables, elements, and imports. You need to do this in a file within your _templates/_ directory named _<type>-template.js_.

Here is an example `page-template.js` (the [default](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js) one included with Greenwood).  You can just copy / paste this to start your own page template.

```js
import { html, LitElement } from 'lit-element';
MDIMPORT;

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

#### Template Hooks
A number of hook variables are defined that tell greenwood to do different things

```js
MDIMPORT;
```

`MDIMPORT;` Tells Greenwood to import a markdown file into this component.  But we also have to define where the compiled markdown element(page) will be placed within our page-template.  Hence below within our `render()` method you will see the `<entry></entry>` element. That defines exactly where to place it.


```js
METAIMPORT;
METADATA;
```

`METAIMPORT;` and `METADATA;` hook variables import the default greenwood meta component and data which handles all your configured meta data.  You can then render this component within the `render()` method using the `METAELEMENT` variable hook.

The complete example can be found in the [greenwood source](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js) which is the default page-template.js if no other is defined.

With a completed page-template.js present in your `src/templates/` folder you can define which page uses it via front-matter at the top of any markdown file.  See [Front Matter Docs](/docs/front-matter#define-template) for more information.  Simply including a file named `page-template.js` will overwrite the greenwood default template for all markdown files, without needing to declare the template at the top of markdown file.

### App Template

In order to make an app template, you need to create a `LitElement` component that contains a predefined hook `MYROUTES` aswell the component element itself **must be defined as `eve-app`**.  You need to do this in a file name and path _`<workspace>`/templates/app-template.js_.

`MYROUTES` is used in our app template to define where our routes will be placed. Greenwood uses [**lit-redux-router**](https://github.com/fernandopasik/lit-redux-router) and will replace the `MYROUTES` placeholder with all page routes automatically.

Here is an example app-template:

```js
import { html, LitElement } from 'lit-element';

// Add the MY-ROUTES(without dash) predefined hook. This is where all your routes will be
// You must define the app-template with the element name eve-app
class AppComponent extends LitElement {
  render() {
    return html\`
      MYROUTES
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