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
```javascript
import { html, LitElement } from 'lit-element';
import '../components/header'; // import our custom element

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


> You now do the same for your `<footer>`.  See the [companion repo](https://github.com/ProjectEvergreen/greenwood-getting-started/) for a complete working example.

### CSS
OK, so we've made some content and some custom components, but what about the look and feel? Yes, of course, let's add some CSS!

For global styles like Google fonts, Bootstrap, background colors, or browser resets, create a file called _src/styles/theme.css_ and Greenwood will make sure these styles get applied in the `<head>` of the doucment, outside of any Shadow DOMs.

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

Now we can `import` this CSS file into our templates.
```javascript
import { html, LitElement } from 'lit-element';
import '../components/header';
import '../styles/theme.css'; // add this line

class PageTemplate extends LitElement {

  ...

}
```

Within our components, we can easily add some styles right within the component definition itself. For example in our header component, we can style it like this and take advantage of the Shadow DOM.

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
    return \`
      <style>
        header {
          color: blue;
        }
      </style>
      <header>This is the header component.</header>
    \`;
  }
}

customElements.define('app-header', HeaderComponent);
```

Taking this all the way with [the code from companion repo](https://vuejs.org/v2/guide/single-file-components.html), you should be able to get a result that looks like this:
![greenwood-getting-started-styled](https://s3.amazonaws.com/hosted.greenwoodjs.io/getting-started-repo-styled.png)

Phew!!  What a journey, but now you have a blog ready to publish!  The last step is to build  and host your project, so let's move on to the [build and deploy section](/getting-started/build-and-deploy/) and make it happen!