---
label: 'blog'
title: State of Greenwood (2023)
template: blog
---

# State of Greenwood (2023)

**Published: April 12, 2023**

About a year has passed since our [first _State of Greenwood_ blog post](/blog/state-of-greenwood-2023/) and wow, what a year of progress it has been!  In our continued effort to make web development easier and more intuitive, we have introduced a significant amount of new features and capabilities into Greenwood, and even the server side we've been able to keep the spirit of the web alive.

I think more than ever we continue to be proud of our effort to embrace not only HTML as the baseline for developing websites, but [actual _.html_ files](/getting-started/) even more so.  We feel that being able to start a project this easily in a manner that can be as accessible as being able to copy / pasting from MDN is critical to the core of our approach.  Greenwood will always [stay true to web standards](/about/how-it-works/) and refrain from introducing any "magic" as much as possible.

Let's take a look back at some key features we added over the past year and in particular putting a spotlight on how web standards factor in, even on the server side! 🔦

## The Year In Review

### Custom Elements as Pages (WCC)

Project Evergreen released a new project last year called [WCC (Web Components Compiler)]() that was designed specifically to make it easy to render native Web Components to HTML on the backend.  Its focus on making SSR (Server Side Rendering) easier for Web Components was designed to manifest features in Greenwood like _Custom Elements as Pages_.

Now, instead of having to spin up a (headless) browser with Puppeteer, WCC now provides the ability to deliver on what we think is a really nice and familiar developer experience for authoring server rendered content.  We think custom elements fit right at home in providing a consistent and standards based solution for authoring pages, just as easily as they do for components.

Here is an example of what authoring an SSR page in Greenwood looks like now
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

However, the `<wc-card></wc-card>` totally _can_ opt-in to [(Declarative) Shadow DOM](https://web.dev/declarative-shadow-dom/) as you can see through its component definition, and its usage of `<slot>`s.  It all works the same!
```js
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

> **Note**: In this example, Greenwood will _not_ ship any JS for this page.  All the HTML is extracted at build / request time from the custom element. 💯

### Web APIs Standardization

In the [v0.28.0 release](/blog/release-0.28.0/), Greenwood made Node 18 the minimum version in particular to make use of the native Fetch API and its many companion APIs like [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL), [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), and [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response), just to name a few.  Greenwood has fully embraced this movement to adopting Web APIs on the server side not only throughout its code base, but basing entire user facing APIs around these standards as well.  Why invent an API when we get everything we need from the web, in Node, and all documented by MDN!

This was especially beneficial to our [Resource Plugin API](/plugins/resource/) as it was already modeling this request / response behavior anyway, and so it was a natural fit to adopt these APIs. To give an idea of this transformation, here is a before snippet of Greenwood's internal plugin for handling CSS.
<!-- eslint-disable-next-line no-unused-vars -->
```js
class StandardCssResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['.css'];
    this.contentType = 'text/css';
  }

  async serve(url) {
    const body = await fs.promises.readFile(url, 'utf-8');

    return {
      body,
      contentType: this.contentType
    };
  }
}
```

And here is what it looks like now, exclusively based on Web APIs.  Nothing ad-hoc anymore! ✨
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

This is just a sampling of the work that we wanted to shout-out over the course of 2022.  You can read about all our releases over in the [blog section](/blog/) of our website.   Some honorable mentions include:
- [Node 18 support](/blog/release/v0-28-0/#node-18) - Upgrading to Node 18 really helped us drive forward on making Web APIs a consistent experience from the front to the back of the stack.
- [API Routes](/blog/release/v0-28-0/#api-routes) -  File based routing convention to make APIs in your projects, based on a standards based `Request` / `Response` model.
- [Build Capacity](/blog/release/v0-27-0/#build-capacity) - Introduction of thread pooling for static builds that rely on SSR based page generation.

## The Year In Front of Us

While we managed to check off a lot of items from last years list, we are carrying a couple items forward as we look to the next horizon for Greenwood; running on serverless and at the edge!  A lot of the work to make that possible was completed in the last year as part of the features listed above, and so Greenwood is poised to cross that bridge very soon now.  It's this last stretch of development that will allow Greenwood to consider being ready for its [1.0 release](https://github.com/ProjectEvergreen/greenwood/milestone/3)!

So what's in store next?  Here are a few:
- [Serverless and Edge runtime support](https://github.com/ProjectEvergreen/greenwood/issues/1008)
- [Data Loading Strategies](https://github.com/ProjectEvergreen/greenwood/issues/952)
- [Hydration Strategies](https://github.com/ProjectEvergreen/greenwood/issues/880)

We still plan to keep contributing to great community efforts and conversations around the web platform like the [Web Components Community Group](https://github.com/w3c/webcomponents-cg) and supporting their initiatives towards pushing web standards forward.  Here were a couple of our contributions to the conversation:
- [Web Components in 5 Years]()
- [Self hydrating custom elements](https://github.com/webcomponents-cg/community-protocols/issues/33)
- [Web Components Interop Specification](https://github.com/webcomponents-cg/community-protocols/issues/35)


## In Closing

TODO
Our hope is by reviewing some of the key features the team was able to accomplish in 2021, and in sharing our outlook for 2022, that we have given a good overview of what Greenwood hopes to accomplish for itself and what we hope it can contribute to the web dev community.  We love the web and we love open source, and our vision for removing the friction and tools between your code and the browser is even more entrenched in us now.

For us, it's great to see support for Web Components rising and we hope to be a champion and companion for all those building for the web, new or seasoned, user or spec author.  Naturally, the decisions we've made come with tradeoffs, as do any of the other options out there in the community, and that is important for us to highlight.  It's not necessarily about right or wrong; it's just emphasizing differing opinions and values.  But this is what is great about open source!  

> _We all think different, and so for us the more we thought about our approach and the implications this could have on long term maintainability, knowledge sharing, and just general practicality, has only cemented our motivations even further to optimize for a web first world._

We want to not only be _your workbench for the web_, but a way to build for the web that looks past the **#hypegeist** and instead emphasizes usage of web APIs in an effort to shy away, where possible, from the complexity and magic often found in today's modern (meta) frameworks.  Owning your code and owning your content is important to us, and developing for the web isn't the burden it once was.  We feel an honest discussion around the efforts to build around and on top of it are worth having.  Looking inside your _node_modules_ or network tab should be encouraging of you to ask yourself; _**what can the web do for me now**_? <img style="width: 15px; display: inline-block" src="/assets/evergreen.svg" alt="Project Evergreen logo"/>