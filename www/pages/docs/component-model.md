---
menu: docs
title: Component Model
---

## Component Model
In this section we'll review a little bit about how you can use Web Components in Greenwood.  Both the native `HTMLElement` and `LitElement` are available by default.

### HTMLElement

_footer.js_
```render javascript
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

  // create templates that interpolate variables and HTML!
  getTemplate() {
    const year = new Date().getFullYear();

    return \`<header>This is the header component.  &copy; ${year}</header>\`;
  }
}

customElements.define('x-footer', FooterComponent);
```

You can then import it in a template and use it within your templates `render` function.

```render javascript
import { html, LitElement } from 'lit-element';
import '../components/footer';

class PageTemplate extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html\`
      <section class='container'>
        <entry></entry>
      </section>

      <section
        <x-footer></x-footer>
      </section>
    \`;
  }
}

customElements.define('page-template', PageTemplate);
```


### LitElement
A simple example of a web component utilizing a basic [LitElement](https://lit-element.polymer-project.org/) base class

_hello-world.js_
```render javascript
import { html, LitElement } from 'lit-element';

class HelloWorld extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html\`
      <div>
        <h1>Hello World!</h1>
      </div>
    \`;
  }
}

customElements.define('hello-world', HelloWorld);
```

Which can then imported and used with

```render javascript
import './hello-world.js

render() {
  return html\`
    <hello-world></hello-world>
  \`
}
```

## References
- [MDN Developer Docs: Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Google Developer Docs: Web Components](https://developers.google.com/web/fundamentals/web-components/)