---
label: 'server-rendering'
menu: side
title: 'Server Rendering'
index: 8
linkheadings: 3
---

## Server Rendering (Beta)

In addition to supporting [static and Single Page application project types](/docs/layouts/), you can also use Greenwood to author routes completely in JavaScript and host these on a server.

> 👉 _To run a Greenwood project with SSR routes for production, just use the [`serve` command](/docs/#cli)._

### Routing

File based routing also applies to server routes.  Just create JavaScript file in the _pages/_ directory and that's it!

```shell
src/
  pages/
    users.js
greenwood.config.js
```

The above would serve content in a browser at `/users/`.

### Usage

In your page _.js_ file, Greenwood supports the following functions you can `export` for providing server rendered configuration and content:
- `default`: Use a custom element to render your page content.  Will take precedence over `getBody`.  Will also automatically track your custom element dependencies, in place of having to define [frontmatter imports](/docs/front-matter/#imports) in `getFrontmatter`.
- `getFrontmatter`: Static [frontmatter](/docs/front-matter/), useful in conjunction with [menus](/docs/menus/) or otherwise static configuration / meta data.
- `getBody`: Effectively anything that you could put into a [`<content-outlet></content-outlet>`](/docs/layouts/#page-templates).
- `getTemplate`: Effectively the same as a [page template](/docs/layouts/#page-templates).

<!-- eslint-disable no-unused-vars -->
```js
async function getFrontmatter(compilation, route, label, id) {
  return { /* ... */ };
}

async function getBody(compilation, route) {
  return '<!-- some HTML here -->';
}

async function getTemplate(compilation, route) {
  return '<!-- some HTML here -->';
}

export default class MyPage extends HTMLElement {
  constructor() { }
  async connectedCallback() {
    this.innerHTML = '<!-- some HTML here -->';
  }
}

export {
  getFrontmatter,
  getBody,
  getTemplate
};
```

#### Web Server Components (default)

When using `export default`, Greenwood supports providing a custom element as the export for your page content, which Greenwood refers to as **Web Server Components (WSCs)**.  It uses [**WCC**](https://github.com/ProjectEvergreen/wcc) by default which also includes support for rendering [Declarative Shadow DOM](https://web.dev/declarative-shadow-dom/).

```js
import '../components/card/card.js'; // <wc-card></wc-card>

export default class UsersPage extends HTMLElement {
  async connectedCallback() {
    const users = await fetch('https://www.example.com/api/users').then(resp => resp.json());
    const html = users.map((user) => {
      const { name, imageUrl } = user;
      return `
        <wc-card>
          <h2 slot="title">${name}</h2>
          <img slot="image" src="${imageUrl}" alt="${name}"/>
        </wc-card>
      `;
    }).join('');

    this.innerHTML = html;
  }
}
```

A couple of notes:
- WSCs run only on the server, thus you have full access to any APIs of the runtime, with the ability to perform one time `async` operations for [data loading](/docs/server-rendering/#data-loading) in `connectedCallback`.
- In the above example, card.js will automatically be bundled for you on the client side!
-  Keep in mind that for these "page" components, you will likely want to _avoid_ rendering into a shadow root in your SSR pages so as to avoid wrapping static content in a Declarative Shadow DOM wrapping `<template>` tag.  However, for any interactive elements within your page, Definitely use Declarative Shadow DOM!

#### Frontmatter

Any Greenwood supported frontmatter can be returned here.  _This is only run once when the server is started_ to populate the graph, which is helpful if you want your dynamic route to show up in a menu like in your header for navigation.

You can even define a `template` and reuse all your existing [templates](/docs/layouts/), even for server routes!

```js
export async function getFrontmatter(compilation, route) {
  return {
    template: 'user',
    menu: 'header',
    index: 1,
    title: `${compilation.config.title} - ${route}`,
    imports: [
      '/components/user.js'
    ],
    data: {
      /* ... */
    }
  };
}
```

> _For defining custom dynamic based metadata, like for `<meta>` tags, use `getTemplate` and define those tags right in your HTML._

So for example, `/pages/artist.js` would render out as `/artists/index.html` and would not require the serve task.  So if you need more flexibility in how you create your pages, but still want to just serve it statically, you can!

#### Body

For just returning content, you can use `getBody`.  For example, return a list of users from an API as the HTML you need.
<!-- eslint-disable no-unused-vars -->
```js
export async function getBody(compilation, page, request) {
  const users = await fetch('http://www.example.com/api/users').then(resp => resp.json());
  const timestamp = new Date().getTime();
  const usersListItems = users
    .map((user) => {
      const { name, imageUrl } = user;

      return `
        <tr>
          <td>${name}</td>
          <td><img src="${imageUrl}"/></td>
        </tr>
      `;
    });

  return `
    <body>
      <h1>Hello from the server rendered users page! 👋</h1>
      <table>
        <tr>
          <th>Name</th>
          <th>Image</th>
        </tr>
        ${usersListItems.join('')}
      </table>
      <h6>Fetched at: ${timestamp}</h6>
    </body>
  `;
}
```
<!-- eslint-enable no-unused-vars -->

#### Templates

For creating a template dynamically, you can use `getTemplate` and return the HTML you need.

```js
export async function getTemplate(compilation, route) {
  return `
    <html>
      <head>
        <meta name="description" content="${compilation.config.title} - ${route} (this route was generated server side!!!)">

        <style>
          * {
            color: blue;
          }

          h1 {
            width: 50%;
            margin: 0 auto;
            text-align: center;
            color: red;
          }
        </style>
      </head>
      <body>
        <h1>This heading was rendered server side!</h1>
        <content-outlet></content-outlet>
      </body>
    </html>
  `;
}
```

### Data Loading

For request time data fetching, Greenwood will pass a native `Request` object and a Greenwood compilation params as "constructor props" to your Web Server Component's `constructor`.  For `async` work, use an `async connectedCallback`.

```js
export default class PostPage extends HTMLElement {
  constructor(request) {
    super();

    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')));
    this.postId = params.get('id');
  }

  async connectedCallback() {
    const { postId } = this;
    const post = await fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`).then(resp => resp.json());
    const { id, title, body } = post;

    this.innerHTML = `
      <h1>Fetched Post ID: ${id}</h1>
      <h2>${title}</h2>
      <p>${body}</p>
    `;
  }
}
```

### Prerender

To export server routes as just static HTML, you can export a `prerender` option from your page set to `true`.

```js
export const prerender = true;
```

> You can enable this for all pages using the [prerender configuration](/docs/configuration/#prerender) option.

### Custom Imports

> ⚠️ _This feature is experimental._
> 
> _**Note**: At this time, [WCC can't handle non-standard javaScript formats](https://github.com/ProjectEvergreen/greenwood/issues/1004), though we hope to enable this by the 1.0 release._

Combined with Greenwood's [custom import resource plugins](https://www.greenwoodjs.io/plugins/custom-plugins/) (or your own!), Greenwood can handle loading custom file extensions on the server side using ESM, like CSS and JSON!

For example, you can now import JSON in your SSR pages and components.
```js
import json from '../path/to/data.json';

console.log(json); // { status: 200, message: 'some data' }
```

**Steps**
1. Make sure you are using Node `v18.15.0`
1. Run the Greenwood CLI using the `--experimental-loaders` flag and pass Greenwood's custom loader
    ```shell
    $ node --experimental-loader ./node_modules/@greenwood/cli/src/loader.js ./node_modules/.bin/greenwood <command>
    ```

### Hybrid Projects

One of the great things about Greenwood is that you can seamlessly move from completely static to server rendered, without giving up either one! 💯

Given the following workspace of just pages

```shell
src/
  pages/
    index.md
    about.md
```

Greenwood would output the following static build output
```shell
public/
  about
    index.html
  index.html
```

Now, add a dynamic route and run `serve`...
```shell
src/
  pages/
    index.md
    about.md
    user.js
```

Greenwood will now build and serve all the static content from the _pages/_ directory as before _BUT_ will also start a server that will now fulfill requests to the newly added server rendered pages too.  Neat!

### Render vs Prerender

Greenwood provides the ability to [prerender](/docs/configuration/#prerender) your project and Web Components.  So what is the difference between that and rendering?   In the context of Greenwood, _rendering_ is the process of generating the _initial_ HTML as you would when running on a server.  _Prerendering_ is the ability to execute exclusively browser code in a browser and capture that result as static HTML.

So what does that mean, exactly?  Basically, you can think of them as being complimentary, where in you might have server side routes that pull content server side (`getBody`), but can be composed of static HTML templates (in your _src/templates_ directory) that can have client side code (Web Components) with `<script>` tags that could be run after through a headless browser.

The hope with Greenwood is that user's can choose the best blend of server rendering and browser prerendering that fits their projects best because running in a browser unlocks more client side capabilities that will (likely) never be available in a server context, like:
- `window` / `document` objects
- Full suite of web component lifecycles
- import maps
- Better UX when JS is turned off

So server rendering, when constraints are understood, can be a lot a faster to execute compared to a headless browser.  However, with good caching strategies, the cost of rendering HTML once with either technique, when amortized over all the subsequent requests and responses, usually ends up being negligible in the long run.

> _So we hope users find a workflow that works best for them and see Greenwood as more of a knob or spectrum, rather than a toggle.  This [blog post](https://developers.google.com/web/updates/2019/02/rendering-on-the-web) also provides a lot of good information on the various rendering strategies implemented these days._  ⚙️