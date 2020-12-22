---
label: 'css-components'
menu: side
title: 'Styles and Web Components'
index: 5
linkheadings: 3
---

## CSS and Web Components

So now that we've made some [content](/getting-started/creating-content/) for your site, I think we can agree it's not quite all "there" yet and could benefit from a little styling and branding.

In this section, we will add the following to your project:

1. Header / Footer - The elements provide a great case for creating some reusable components and with Custom Elements, we can create self contained reusable components for our site.
1. Styles - Of course we want things to look nice too!  We'll add some CSS to help hang things in just right the place.

### Web Components
Web Components are supported out of the box with Greenwood using `HTMLElement` or **LitElement**.  For this guide, we'll use a "vanilla" custom element for our header, in _src/components/header.js_.
```javascript
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
    return `
      <style>
        /* CSS will go here */
      </style>

      <header>Welcome to my Blog!</header>
    `;
  }
}

customElements.define('app-header', HeaderComponent);
```

Now we can use it in both our templates by:
1. Referencing our component via a `<script>` tag with the `type="module"` attribute
1. Using our custom element's tag name of `<app-header>` in our `<body>`

```html
<html>

  <head>
    <script type="module" src="/components/header.js"></script>
  </head>
  
  <body>
    <app-header></app-header>

    <content-outlet></content-outlet>
  </body>
  
</html>
```


> You can now do the same for a `<footer>`.  See the [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started/) for a complete working example.

### CSS
OK, so we've made some content and some custom components, but what about the look and feel? Yes, of course, let's add some CSS!

For global styles like Google fonts, Bootstrap, background colors, or browser resets, let's create a file called _src/styles/theme.css_ that we can reference in all templates.

Here are some styles you can add to your site to snap things into place a little bit.
```css
/* theme.css */
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

Now we can `<link>` this CSS file into our template.  Easy!  💥
```html
<html>

  <head>
    <script type="module" src="/components/header.js"></script>
    <link rel="stylesheet" href="/styles/theme.css"> 
  </head>
  
  <body>
    <app-header></app-header>

    <content-outlet></content-outlet>
  </body>
  
</html>
```

Within our components, we can easily add some styles right within the component definition itself. For example in our header component, we can style it like this and take advantage of [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM).

```javascript
class HeaderComponent extends HTMLElement {
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
        header {
          color: blue;
        }
      </style>

      <header>This is the header component.</header>
    `;
  }
}

customElements.define('app-header', HeaderComponent);
```

Taking this all the way with [the code from companion repo](https://vuejs.org/v2/guide/single-file-components.html), you should be able to get a result that looks like this:
![greenwood-getting-started-styled](https://s3.amazonaws.com/hosted.greenwoodjs.io/getting-started-repo-styled.png)

Phew!!  What a journey, but now you have a blog ready to publish!  The last step is to build  and host your project, so let's move on to the [build and deploy section](/getting-started/build-and-deploy/) and make it happen!