---
label: 'blog'
title: State of Greenwood (2023)
template: blog
---

# State of Greenwood (2023)

**Published: May 3, 2023**

<img
  src="/assets/greenwood-logo-300w.webp"
  alt="Greenwood Logo"
  srcset="/assets/greenwood-logo-300w.webp 350w,
          /assets/greenwood-logo-500w.webp 500w,
          /assets/greenwood-logo-750w.webp 750w,
          /assets/greenwood-logo-1000w.webp 1000w,
          /assets/greenwood-logo-1500w.webp 1500w"/>

## The Full Stack Web

About a year has passed since our [first _State of Greenwood_ blog post](/blog/state-of-greenwood-2022/) and wow, what a year of progress it has been!  In our continued effort to make web development easier to get started with, we have made great strides in our journey of promoting the best of web standards not only for the frontend, but also on the backend as well.  The web is _full stack_, even Web Components! (and we even picked up a new logo along the way!)

I think more than ever we continue to be proud of our efforts to embrace not only HTML as the baseline for shipping websites, but also being able to write [actual _.html_ files](/getting-started/).  We feel that being able to start a project this intuitively from any skill level makes Greenwood the perfect on-ramp for any web development project, and it would not be incorrect to say that we are happy to offload some of our docs to MDN if we can!  Why create a new API if a good one already exists?  In this way Greenwood will always [stay true to web standards](/about/how-it-works/) and refrain from introducing any "magic" as much as possible.

So let's take a look back at some key features we added over the past year that we feel best exhibits what makes us excited not only for how we can help developers achieve their goals today, but also what it means for the next year of Greenwood development. 🔍

## The Year In Review

### Custom Elements as Pages (WCC)

Project Evergreen released a new project last year called [**WCC (Web Components Compiler)**](https://github.com/ProjectEvergreen/wcc) that was designed specifically to make it easy to render native Web Components to HTML on the server.  Its focus is on making SSR (Server Side Rendering) for Web Components as intuitive as possible and this has helped us to manifest features in Greenwood like _Custom Elements as Pages_.  WCC is also key to our strategy to enable Greenwood projects to run in serverless and edge runtimes.

Instead of having to spin up a (headless) browser with Puppeteer, WCC now provides the ability to deliver on what we think is a familiar developer experience for authoring server rendered content.  We think custom elements fit right at home in providing a consistent and standards based solution for authoring page entry points, just as easily as they do for components.

Here is an example of what authoring an SSR page in Greenwood looks like with WCC.
```js
// src/pages/artists.js
import '../components/card.js';

export default class ArtistsPage extends HTMLElement {
  async connectedCallback() {
    const artists = await fetch('https://.../api/artists').then(resp => resp.json());
    const html = artists.map(artist => {
      const { name, imageUrl } = artist;

      return `
        <wc-card>
          <h2 slot="title">${name}</h2>
          <img slot="image" src="${imageUrl}" alt="Picture of ${name}"/>
        </wc-card>
      `;
    }).join('');

    this.innerHTML = `
      <h1>List of Artists: ${artists.length}</h1>
      ${html}
    `;
  }
}
```

Since WCC is un-opinionated in how you author your custom elements, you will notice from the above snippet that there is no usage of Shadow DOM.  This is intentional as this page content is _intended for the Light DOM_.  The goal here is to allow users to opt-in as needed where it makes sense, because not everything needs the tight encapsulation of a Shadow Root.

However, the `<wc-card></wc-card>` component totally _can_ opt-in to [(Declarative) Shadow DOM](https://web.dev/declarative-shadow-dom/) as you can see through its component definition, and its usage of `<slot>`s.  It all works the same!
```js
// src/components/card.js
const template = document.createElement('template');

template.innerHTML = `
  <style>
    :host {
      display: block;
      width: 80%;
      margin: 50px auto!important;
      text-align: center;
    }

    [name="title"] {
      color: red;
    }

    ::slotted(img) {
      max-width: 500px;
    }

    hr {
      border-top: 1px solid var(--color-accent);
    }
  </style>

  <div class="card">
    <slot name="title">My default title</slot>
    <slot name="image"></slot>
  </div>

  <hr/>
`;

export default class Card extends HTMLElement {
  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
  }
}

customElements.define('wc-card', Card);
```

> **Note**: In this example, Greenwood will _not_ ship any JS for this page by default.  All the HTML is extracted at build / request time from the custom element. 💯

### Web APIs Standardization

In the [v0.28.0 release](/blog/release-0.28.0/), Greenwood made Node 18 the minimum version, in particular to leverage the native Fetch API and its many companion APIs like [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL), [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), and [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) just to name a few.  Greenwood has fully embraced this movement to adopting Web APIs on the server side not only throughout its code base, but now basing user facing APIs around these standards as well.  Why invent an API when we get everything we need from the web, in Node, and all documented by MDN?

This was especially beneficial to our [Resource Plugin API](/plugins/resource/) as it was already modeling this request / response paradigm anyway albeit in a very ad-hoc fashion, and so it was a natural fit to adopt these APIs. To give an idea of this what this migration looked like, here is a before snippet of Greenwood's internal plugin for handling CSS.
<!-- eslint-disable no-unused-vars -->
```js
class StandardCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/css';
  }

  async shouldServe(url, headers) {
    return this.extensions.indexOf(path.extname(url)) >= 0;
  }

  async serve(url, headers) {
    const body = await fs.promises.readFile(url, 'utf-8');

    return {
      body,
      contentType: this.contentType
    };
  }
}
```
<!-- eslint-enable no-unused-vars -->

And here is what it looks like now, now based on Web APIs and standards. ✨
<!-- eslint-disable-next-line no-unused-vars -->
```js
class StandardCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['css'];
    this.contentType = 'text/css';
  }

  async shouldServe(url) {
    const { protocol, pathname } = url;

    return protocol === 'file:' && this.extensions.includes(pathname.split('.').pop());
  }

  async serve(url) {
    const body = await fs.promises.readFile(url, 'utf-8');

    return new Response(body, {
      headers: new Headers({
        'Content-Type': this.contentType
      })
    });
  }
}
```

### Custom Imports

In continuing with the theme of Web APIs, Greenwood also introduced experimental support for custom loaders in NodeJS, allowing users to start tapping into the upcoming [_Import Assertions specification_](https://v8.dev/features/import-assertions).

This feature compliments Greenwood's plugin support for using ESM for non standard module formats like CSS and JSON for client side (browser) contexts, by now making this experience consistent on the server side too!  Starting with _.css_ and _.json_, you can now use native ESM to include these assets right into your SSR pages!

```js
// src/pages/index.js
import packageJson from '../../package.json';
import css from '../main.css';

export default class Home extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <head>
        <title>${packageJson.name}</title>

        <style>
          ${css}
        </style>
      </head>

      <body>
        <!-- ... -->
      </body>
    `;
  }
}
```

What's really neat is that there is no bundling going on, just a real time transformation from source format to ESM, using the NodeJS runtime!  This currently depends on an experimental feature in NodeJS so checkout our [documentation](/docs/server-rendering/#custom-imports) for full details and usage instructions.


> _Before the Greenwood `v1.0.0` release, we do aim to align this syntax with the [**Import Assertions** spec](https://github.com/ProjectEvergreen/greenwood/issues/923) more closely for client and server, while also looking to support [additional formats](https://github.com/ProjectEvergreen/greenwood/issues/1004) like TypeScript._

----

This is just a sampling of the work that we wanted to share over the course of the last year, and you can read about all our releases over in the [blog section](/blog/) of our website.   Some honorable mentions include:
- [Node 18 support](/blog/release/v0-28-0/#node-18) - Upgrading to Node 18 really helped us drive forward on making Web APIs a consistent experience from the front to the back of the stack.
- [API Routes](/blog/release/v0-28-0/#api-routes) -  File based routing convention to make API endpoints in your projects, based on a standard `Request` / `Response` model.
- [Build Capacity](/blog/release/v0-27-0/#build-capacity) - Introduction of thread pooling for static builds that rely on SSR based page generation.

## The Year In Front of Us

While we managed to check off a lot of items from last years list, we already have our sites set on the next horizon for Greenwood; running on serverless and at the edge!  A lot of the work to make this possible was completed in the last year as part of the features listed above, and so Greenwood is poised to cross that bridge very soon now.  It's this last stretch of development that will allow Greenwood to consider being ready for its [1.0 release](https://github.com/ProjectEvergreen/greenwood/milestone/3)!

So what's in store next?  Here are a few key items we're tracking:
- [Serverless and Edge runtime support](https://github.com/ProjectEvergreen/greenwood/issues/1008)
- [Agnostic Runtime](https://github.com/w3c/webcomponents-cg/discussions/39#discussioncomment-3452237)
- [Data Loading Strategies](https://github.com/ProjectEvergreen/greenwood/issues/952)
- [Hydration Strategies](https://github.com/ProjectEvergreen/greenwood/issues/880)

We still plan to keep contributing to great community efforts and conversations around the web platform like the [Web Components Community Group](https://github.com/w3c/webcomponents-cg) and supporting their initiatives towards pushing web standards forward for the web and Web Components.  Here were a couple of our contributions to the conversation in the past year:
- [Web Components in 5 Years](https://github.com/w3c/webcomponents-cg/discussions/39#discussioncomment-3452237)
- [Self hydrating custom elements](https://github.com/webcomponents-cg/community-protocols/issues/33)
- [Web Components Interop Specification](https://github.com/webcomponents-cg/community-protocols/issues/35)


## In Closing

We're really encouraged to see the progress of web development these days, especially in seeing the growing adoption of web standards on the backend in tools like [Deno](https://deno.land/api@v1.33.1?unstable=), and the creation of groups like the [WinterCG](https://wintercg.org/) to help steward it.  With the proliferation of many great JavaScript runtimes, competing against a standard will ultimately benefit users and maintainers, allowing us to mix and match as needed to find the right runtime for our projects.

Greenwood wants to be there every step of the way to help get your projects out there; from SPA to SSG to SSR to everything in between.  We can't wait to see what you build next!  <img style="width: 15px; display: inline-block" src="/assets/evergreen.svg" alt="Project Evergreen logo"/>