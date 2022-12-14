---
label: 'API-routes'
menu: side
title: 'API Routes'
index: 9
linkheadings: 3
---

## API Routes

Greenwood has support for API routes, which are just functions that run on the server, and take in a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), and return a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response).

### Usage

API routes follow a file based routing convention, just like [pages](/docs/layouts/#pages).  So this structure
```shell
src/
  api/
    greeting.js
```

Will yield an endpoint available at `/api/greeting`.

Here is an example of that API, which ready a query parameter of `name` and returns a JSON response.

```js
export async function handler(request) {
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'World';
  const body = { message: `Hello ${name}!!!` };

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

### WCC

As [WCC](https://github.com/ProjectEvergreen/wcc) already comes with Greenwood, it can be used to generate HTML on the fly for over the wire transmission to the browser.  This is great for generating HTML "fragments" on the server side using Web Components, thus being able to leverage your components on the client _and_ the server!  As the HTML is added the DOM, if the custom element definition has been loaded client side too, these components will hydrate automatically and become instantly interactive.  (think of appending more items to a virtualized list).  🚀

An example of rendering a "card" component in an API route might look like look this.
```js
// card.js
export default class Card extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name');

    this.innerHTML = `
      <h1>Hello ${name}!!!</h1>
    `;
  }
}

customElements.define('x-card', Card);
```

```js
// API route
import { renderFromHTML } from 'wc-compiler';

export async function handler(request) {
  const headers = new Headers();
  const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
  const name = params.has('name') ? params.get('name') : 'World';
  const { html } = await renderFromHTML(`
    <x-card name="${name}"></x-card>
  `, [
    new URL('../components/card.js', import.meta.url)
  ]);

  headers.append('Content-Type', 'text/html');

  return new Response(html, { headers });
}
```