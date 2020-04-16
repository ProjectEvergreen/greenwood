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

```render js
import { html, LitElement } from 'lit-element';
MDIMPORT;

class PageTemplate extends LitElement {
  render() {
    return html\`
      <div class='wrapper'>
        <div class='page-template content'>
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

```render js
MDIMPORT;
```

`MDIMPORT;` Tells Greenwood to import a markdown file into this component.  But we also have to define where the compiled markdown element(page) will be placed within our page-template.  Hence below within our `render()` method you will see the `<entry></entry>` element. That defines exactly where to place it.


The complete example can be found in the [greenwood source](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js) which is the default page-template.js if no other is defined.

With a completed page-template.js present in your `src/templates/` folder you can define which page uses it via front-matter at the top of any markdown file.  See [Front Matter Docs](/docs/front-matter#define-template) for more information.  Simply including a file named `page-template.js` will overwrite the greenwood default template for all markdown files, without needing to declare the template at the top of markdown file.

### App Template

In order to make an app template, you need to create a `LitElement` component that contains a number of pre-defined variables, elements, and imports. You need to do this in a file called  your _<workspace>templates/app-template.js_.

First, we need our app template to use routes, by default greenwood uses [**lit-redux-router**](https://github.com/fernandopasik/lit-redux-router).

Here is Greenwood's app-template, which you can copy / paste as a starting point for your own custom app template, _though it is recommended to let Greenwood manage this for you_.

```render js
import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';

// initialize a redux store
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;
const store = createStore(
  (state, action) => state,
    compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk)));


// Next we need to import a list of files that will be generated when Greenwood is run
import '../index/index.js';
import './list';

// Finally we can connect to our store and define our component.
connectRouter(store);

// Add a \`MYROUTES\` predefined hook. This is where all your routes will be loaded.
// You may also opt to define a custom 404 route here.
class AppComponent extends LitElement {
  render() {
    return html\`
      MYROUTES
      <lit-route><h1>404 Not found</h1></lit-route>
    \`;
  }
}

customElements.define('app-root', AppComponent);
```

> A working example can be found in the [greenwood source](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js) which is the default _app-template.js_ if no other is defined.


### Pages
You can create all your pages in a _pages/_ directory in your projects workspace.  You can also create nested pages and the page paths will map accordingly.

For example, given this folder structure:
```render shell
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