## CSS and Web Components

So now that we've made some [content](/getting-started/creating-content/) for our site, I think we can agree it's not quite all "there" yet.
1. Header / Footer - A great case for creating some reusble components. With Custom Elements, we can create self contained reusable components for our site.
1. Styles - Of course we want things to look nice too!  We'll add some CSS to help hang things in just right the place.

## Web Components
Web Components are supported out of the box with Greenwood using `HTMLElement` or **LitElement**.  For this guide, we'll use a "vanilla" custom element for our header, at _src/components/header.js_.  
```render javascript
class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    // create a Shadow DOM
    this.root = this.attachShadow({ mode: 'closed' });
  }

  // run some code when the component is ready
  // like initializing our component's DOM
  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  // create templates that interpolate variables and HTML!
  getTemplate() {
    return \`
      <style>
        /* CSS will go here */ 
      </style>
      
      <header>Welcome to my Blog!</header>
    \`;
  }
}

customElements.define('app-header', HeaderComponent);
```

Now we can use it in both our templates, like so:
```
import { html, LitElement } from 'lit-element';
import '../components/header'; // import our custom element

MDIMPORT;

class PageTemplate extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html\`
      <div>
        <!-- using our custom header -->
        <app-header></app-header>

        <entry></entry>

        <!-- you can add your custom footer here -->
      </div>
    \`;
  }
}

customElements.define('page-template', PageTemplate);
```


You can also do the same for a footer.

## CSS
OK, so we've made some content and some custom component, but what about the look and feel? Yes, of course, let's add some CSS!

For global styles, Greenwood provides a simple mechanism by simply creating a file called _src/styles/theme.css_ and put any truly global styles we want to apply to our site, like Google fonts, background colors, or browser resets.  Here are some styles we can add to our site to snap things into place a little bit.

_theme.css_
```render css
@import url('//fonts.googleapis.com/css?family=Source+Sans+Pro&display=swap');

* {
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Source Sans Pro', sans-serif;
  color: #020202;
}
```

Now we can `import` this CSS into our templates.
```render javascript
import { html, LitElement } from 'lit-element';
import '../components/header';
import '../styles/theme.css'; // add this line

MDIMPORT;

class PageTemplate extends LitElement {

  ...

}
```

Within our components, we can easily add some styles right within our component definintion itself, for example in our header component, we can style it like this and take advantage of the [Shadow DOM]().

```render javascript
class HeaderComponent extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: 'closed' });
  }

  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return \`
      <style>
        :host{
          color: blue;
        }
      </style>
      <header>This is the header component.</header>
    \`;
  }
}

customElements.define('app-header', HeaderComponent);
```

Phew!!  What a journey, but now we have a our blog ready to go!  The last step is to build  and host your project, so let's move on to the [next section](/getting-started/build-and-deploy/) and make it happen!