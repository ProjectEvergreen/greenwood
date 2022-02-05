---
label: 'server-rendering'
menu: side
title: 'Server Rendering'
index: 8
linkheadings: 3
---

## Server Rendering

In additional to suppoting [static and Single Page applications](/docs/layouts/), you can also use Greenwood to author routes completely in JavaScript and host these on a server.

> 👉 _To run a Greenwood project with SSR routes for production, just use the [`serve` command](/docs/#cli)._

### Routes

File based routing also applies to server routes.  Just create JavaScript file in the _pages/_ directory and that's it!

```shell
src/
  pages/
    users.js
greenwood.config.js
```

The above would serve content in a browser at `/users/`.

### API

In your _[page].js_ file, Greenwood supports three functions you can `export` for providing server rendererd configuration and content:
- `getFrontmatter`: Static [frontmatter](/docs/front-matter/), useful in conjunction with [menus](/docs/menus/) or otherwise static configuration / meta data.
- `getBody`: Effectively anything that you could put into a [`<content-outlet></content-outlet>`](/docs/layouts/#page-templates).
- `getTemplate`: Effectively the same as a [page template](/docs/layouts/#page-templates).

```js
async function getFrontmatter(compilation, route, route, id) {
  return { /* ... */ };
}

async function getBody(compilation, route) {
  return `/* some HTML here */`;
}

async function getTemplate(compilation, route) {
  return `/* some HTML here */`;
}

export {
  getFrontmatter,
  getBody,
  getTemplate
}
```

#### Frontmatter

Any Greenwood supported frontmatter can be returned here.  _This is only run once when the server is started_ to populate the graph, which is helpful if you want your dyanmic route to show up in a menu like in your header for navigation.

You can even define a `template` and reuse all your existing [templates](/docs/layouts/), even for server routes!

```js
// example
async function getFrontmatter(compilation, route) {
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

#### Body

For just returning content, you can use `getBody`.  For example, return a list of users from an API as the HTML you need.

```js
import fetch from 'node-fetch'; // this needs to be installed from npm

async function getBody(compilation) {
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

#### Templates

For creating a template dynamically, you can use `getTemplate` and return the HTML you need.

```js
async function getTemplate(compilation, route) {
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

Greenwood will now build and serve all the static content from the _pages/_ directory BUT will also start a server that will fulfill requests to anything server rendered pages.  Neat!

### Render vs Prerender

Greenwood provides the ability to [prerender](/docs/prerender/) your project and Web Components using Puppeteer.  So what is the difference between that and rendering?   In the context of Greenwood, _rendering_ is the process of generating the _initial_ HTML in a completely static manner intended to be run on a server.  _Prerendering_ is the ability to execute exclusively browser code in a browser and capture that result as static HTML.

So what does that mean, exactly?  Basically, you can think of them as being complimentary, where in you might have server side routes that pull content server side (`getBody`), but can be composed of static HTML templates (in your _src/templates_ directory) that can have client side code (Web Components) with `<script>` tags that could be run after through a headless browser.

The hope with Greenwood is that user's can choose the best blend of server rendering and browser prerendering that fits their projects best because running in a browser unlocks more client side capabilities that will (likely) never be available in a server context, like:
- `window` / `document` objects
- Full suite of web component lifecycles
- import maps
- Better UX when JS is turned off

So server rendering, when constraints are understood, can be a lot a faster to execute compared to a headless browser.  However, with good caching strategies, the cost of rendering HTML once with either technique, when amortized over all the subsequent requests and responses, usually ends up being neligble in the long run.

> _So we hope users find a workflow that works best for them and see Greenwood as more of a knob or spectrum, rather than a toggle._  ⚙️