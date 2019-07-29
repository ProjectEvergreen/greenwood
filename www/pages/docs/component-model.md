## Component Model

Resources:

* [MDN Developer Docs WebComponents](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
* [Google Developer Docs WebComponents](https://developers.google.com/web/fundamentals/web-components/)


### HTMLElement Component Example

**hello-world.js**
```render js
class HelloWorld extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback() {
    const h1 = document.createElement('h1');
    h1.textContent = 'hello world!';
    document.body.appendChild(h1);
  }
}

customElements.define('hello-world', HelloWorld);
```

**index.html**
```render html
<html>
  <body>
    <hello-world></hello-world>
    <script type="text/javascript" src="hello-world.js"></script>
  </body>
</html>
```

### LitElement Component
A simple example of a web component utilizing a basic [LitElement](https://lit-element.polymer-project.org/) base class

**hello-world.js**
```render js

import { html, LitElement } from 'lit-element';

class HelloWorld extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html\`
      <div>
        <h1>Hello World</h1>
      </div>
    \`;
  }
}

customElements.define('hello-world', HelloWorld);

```

Which can then imported and used with

```render js

import './hello-world.js

<hello-world></hello-world>

```