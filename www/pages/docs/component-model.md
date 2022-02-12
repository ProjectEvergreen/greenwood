---
label: 'component-model'
menu: side
title: 'Component Model'
index: 1
---

## Component Model
Greenwood aims to support and optimize around the standard capabilities of the web platform and its features.  In particular, the concept of using Web Components as a way to add and isolate interactivity and dynamic content into your application and that it can all be prerendered for you, just like you could do with any server side templating language.

The options for how to design your app effectively comes down to what you're trying to build, so if that's with the native `HTMLElement` or something based on it like **LitElement** (installed separately), **Greenwood** will take care of the rest.

Below are a couple examples to get you going.

> _Check out our [README](https://github.com/ProjectEvergreen/greenwood#built-with-greenwood) for more examples of sites built with **Greenwood** to see what's possible._

## Example

Below is an example of creating a footer component using native `HTMLElement` within a page template of a Greenwood project. This is all just vanilla HTML / CSS / JS.

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


### Alternatives
An alternative like [**LitElement**](https://lit.dev/) would work the same way.

> _Make sure you have installed LitElement with **npm** first!_

_src/components/greeting.js_
```javascript
import { html, LitElement } from 'lit';

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


> Some notes / recommendations about ShadowDOM from [our research](https://github.com/ProjectEvergreen/greenwood/pull/454)
> - [`<slot>` should be named](https://github.com/Polymer/lit/issues/824#issuecomment-535574662)
> - `<slot>` only supports a [shallow (one) level of nesting](https://javascript.info/slots-composition).  A `<slot>` tag must be within a direct descendant of its `:host`.
> ```html
> <h3>Content from inside the custom element. (inside HTMLElement)</h3>
> <h3>
>    <slot name="content"></slot> <!-- will show -->
> <h3>
> <div>
>   <h3>
>      <slot name="content"></slot> <!-- wont show -->
>    <h3>
> </div>
