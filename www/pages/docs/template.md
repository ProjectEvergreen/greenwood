## Templates

Greenwood has two types of templates: App Template and Page Templates.  The former is a template which encompasses all pages within it(the parent element) while the latter is the inner(child) element for individual pages.


### Page Templates

In order to make a page template, you need to create a LitElement component that contains a number of pre-defined variables, elements, and imports. You need to do this in a file within your `src/templates/` directory named `yourtemplatename-template.js`.  **Note**: the filename must be appended with `-templates.js`.

Here is an example `page-template.js` (the default one included with greenwood).

```render js
import { html, LitElement } from 'lit-element';
MDIMPORT;
METAIMPORT;
METADATA;

class PageTemplate extends LitElement {
  render() {
    return html\`
      METAELEMENT
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

A number of hook variables are defined that tell greenwood to do different things

```render js
MDIMPORT;
```

Tells Greenwood to import a markdown file into this component.  But we also have to define where the compiled markdown element(page) will be placed within our page-template.  Hence below within our `render()` method you will see the `<entry></entry>` element. That defines exactly where to place it.


```render js
METAIMPORT;
METADATA;
```

This imports the default greenwood meta component which handles all your configured meta data.  You can then place this component within the `render()` method using the `METAELEMENT` variable hook.

The complete example can be found in the [greenwood source](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/page-template.js) which is the default page-template.js if no other is defined.

With a completed page-template.js present in your `src/templates/` folder you can define which page uses it via front-matter at the top of any markdown file.  See [Front Matter Docs](/docs/front-matter#define-template) for more information

### App Templates

In order to make an app template, you need to create a LitElement component that contains a number of pre-defined variables, elements, and imports. You need to do this in a file within your `src/templates/` directory named `app-template.js`.  **Note**: The filename must be named `app-template.js` to differentiate between app and page templates.

First, we need our app template to use routes, by default greenwood uses lit-redux-router. So in order to import that, we need to define a redux store.

```render js
import { html, LitElement } from 'lit-element';
import { connectRouter } from 'lit-redux-router';
import { applyMiddleware, createStore, compose as origCompose, combineReducers } from 'redux';
import { lazyReducerEnhancer } from 'pwa-helpers/lazy-reducer-enhancer.js';
import thunk from 'redux-thunk';

// eslint-disable-next-line no-underscore-dangle
const compose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || origCompose;

// eslint-disable-next-line
const store = createStore(
  (state, action) => state, // eslint-disable-line
  compose(lazyReducerEnhancer(combineReducers), applyMiddleware(thunk)));
```

Next we need to import a list of components that will be generated when greenwood is run, as well as our root element.


```render js
import '../index/index.js';
import './list';
```

Finally we can connect to our store and define our component.

```render js
connectRouter(store);

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

The final step is to make sure you add a `MYROUTES` predefined hook. This is where all your routes will be loaded. You may also opt to define a custom 404 route here.

The complete example can be found in the [greenwood source](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/cli/templates/app-template.js) which is the default app-template.js if no other is defined.


