---
label: 'components-and-styles'
menu: side
title: 'Components and Styles'
index: 5
linkheadings: 3
---

## Component and Styles

So now that we've made some [content](/getting-started/creating-content/) for your site, I think we can agree it's not quite all "there" yet and could benefit from a little styling and branding.

In this section, we will add the following to your project:

1. Header / Footer - These provide a great case for creating some reusable components with Custom Elements, we can create self contained reusable components for our site.
1. Styles - Of course we want things to look nice too!  We'll add some CSS to help hang things in just right the place.

### Templating
For this guide, we'll use a "vanilla" custom element for our footer.

Start by creating a file called _src/components/footer.js_ with the following code in it.
```javascript
class FooterComponent extends HTMLElement {
  constructor() {
    super();

    // creates a Shadow DOM root
    this.root = this.attachShadow({ mode: 'closed' });
  }

  // run some code when the component is ready
  // like initializing our component's DOM / innerHTML
  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  // create templates that can interpolate variables and HTML!
  getTemplate() {
    const year = new Date().getFullYear();

    return `
      <style>
        /* CSS will go here */
      </style>

      <footer>
        <h4>My Blog &copy;${year}</h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);
```

Now we can use it in a template by:
1. Referencing our component file via a `<script>` tag with the `type="module"` attribute
1. Using our custom element's tag name of `<app-footer>` in our `<body>`

```html
<html>

  <head>
    <script type="module" src="/components/footer.js"></script>
  </head>
  
  <body>
    <content-outlet></content-outlet>

    <app-footer></app-footer>
  </body>
  
</html>
```

Now you can do the same for an `<app-header>`.  See the [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started/) for a complete working example.

> _You can find more information about component models and Greenwood [here](/docs/component-model/)._

### CSS
OK, so we've made some content and some custom elements, but what about the look and feel? Yes, of course, let's add some CSS!

For global styles like Google fonts, Bootstrap, background colors, or browser resets, let's create a file called _src/styles/theme.css_ that we can reference in all our templates.

Here are some styles you can add to your site to snap things into place a little bit.
```css
/* theme.css */
* {
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Source Sans Pro', sans-serif;
  color: #020202;
}
```

Now we can `<link>` this CSS file into our template.  Easy!  💥
```html
<html>

  <head>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link rel="stylesheet" href="//fonts.googleapis.com/css2?family=Source+Sans+Pro&display=swap">
    <link rel="stylesheet" href="/styles/theme.css"> 
    <script type="module" src="/components/header.js"></script>
  </head>
  
  <body>
    <content-outlet></content-outlet>

    <app-footer></app-footer>
  </body>
  
</html>
```

Within our components, we can easily add some styles right within the component definition itself. For example in our header component, we can style it like this and take advantage of [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM).

```javascript
class FooterComponent extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: 'closed' });
  }

  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  getTemplate() {
    return `
      <style>
        :host footer {
          color: blue;
        }
      </style>

      <footer>
        <h4>My Blog &copy;${year}</h4>
      </footer>
    `;
  }
}

customElements.define('app-footer', FooterComponent);
```

Taking this all the way with [the code from companion repo](https://vuejs.org/v2/guide/single-file-components.html), you should be able to get a result that looks like this:
![greenwood-getting-started-styled](https://s3.amazonaws.com/hosted.greenwoodjs.io/getting-started-repo-styled.png)

Phew!!  What a journey, but now you have a blog ready to publish!  The last step is to build  and host your project, so let's move on to the [build and deploy section](/getting-started/build-and-deploy/) and make it happen!