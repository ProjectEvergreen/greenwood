---
label: 'component-model'
menu: side
title: 'Component Model'
index: 1
---

## Component Model
Greenwood aims to support and optimize around the standard capabilities of the web platform and its features.  In particular, the concept of using Web Components as a way to add interactivity and dynamic content into your application and... that can all be prerendered for you, just like you could do with any server side templating language.

The options for how to design your app efficetively come down to what you're trying to build, so if that's with the native `HTMLElement` or something based on it like **LitElement** (installed seperately), **Greenwood** will take care of the rest.

Below are a couple examples to get you going.  

> _Check out our [README](https://github.com/ProjectEvergreen/greenwood#built-with-greenwood) for more examples of sites built with **Greenwood** to see what's possible._

## Example

Below is an example of creating a footer component using native `HTMLElement` within a page template of a Greenwood project. This is all just normal HTML / CSS / JS.

### Component

Our component, in a file called _src/components/footer.js_ could look like this

```js
class FooterComponent extends HTMLElement {
  constructor() {
    super();
    
    // create a closed Shadow DOM
    this.root = this.attachShadow({ mode: 'closed' });
  }
  
  // run some code when the component is ready
  connectedCallback() {
    this.root.innerHTML = this.getTemplate();
  }

  // function can be called anything you want
  // return a string to be set to innerHTML, can include variable interpolation!
  getTemplate() {
    const year = new Date().getFullYear();

    return `<footer>This is the header component.  &copy; ${year}</footer>`;
  }
}

customElements.define('my-footer', FooterComponent);
```

> _You can use anything you want for the element's tag name (e.g. `app-footer`, `x-footer`, etc), it just needs to have a `-` in the name_.

### Usage

You can then use it within a page template.

```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <script type="module" src="/components/footer.js"></script>  
  </head>

  <body>
    <my-footer></my-footer>
  </body>
  
</html>
```


### Alternaties
An alternaative like [**LitElement**](https://lit-element.polymer-project.org/) would work the same way.  

> _Make sure you have installed LitElement with **npm** first!_

_src/components/greeting.js_
```javascript
import { html, LitElement } from 'lit-element';

class GreetingComponent extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html`
      <div>
        <h1>Hello World!</h1>
      </div>
    `;
  }
}

customElements.define('x-greeting', GreetingComponent);
```

```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <script type="module" src="/components/greeting.js"></script>  
  </head>

  <body>
    <x-greeting></x-greeting>
  </body>
  
</html>
```

## References
- [MDN Developer Docs: Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Google Developer Docs: Web Components](https://developers.google.com/web/fundamentals/web-components/)