---
label: 'how-it-works'
menu: side
title: 'How It Works'
index: 1
linkheadings: 3
---

## How It Works

### Philosophy

At its heart, Greenwood is all about web standards.  With the browser becoming such a powerful tool, especially with the advent of [ECMAScript Modules (ESM)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) now having ubiquitous support in modern browsers, an entirely new workflow paradigm has emerged in which the browser can do more of the heavy lifting in our web dev workflows.  In this way, less tooling and dependencies are needed to achieve excellent local development workflows as well as needing less overhead to maintain that stack.

Greenwood wants to take advantage of this opportunity to join in with other projects that are re-evaluating the landscape and thinking of a more unbundled world.  One with less reliance on across the board bundling and transpilation, and one that just transforms on the fly only when needed.  This paradigm lends itself really well to speedy local development workflows as well as benefiting end users who can be shipped more modern code.  And for developers, now the code you write might actually look familiar while debugging in your browser!


### CLI

To actually use Greenwood, users will interact with the Greenwood CLI.  The CLI is what powers all the workflows available by Greenwood and builds your project for local development and production builds.  It supports a configuration file that can be extended with plugin so that it can be extended to support additional workflows not intended to be maintained in core.

During _development_ the CLI will:
- Instantaneously start a local web server with live reload.
- Process requests on the fly only for the content or code you need for a given page.
- Supports loading dependencies from _node_modules_ using an [`importMap`](https://github.com/WICG/import-maps) to avoid bundling.
- While Greenwood is ESM first, we have a [plugin](/plugins/custom-plugins/) to transform CommonJS into ESM (🤞)

For _production_ builds:
- Combine all your code and dependencies into efficient modern bundles including minifying your JavaScript and CSS.
- Optimizes loading of JavaScript and CSS assets using web hints like `preload` and `prefetch`.
- Provides the option to pre-render your JavaScript (e.g. Web Components) to static HTML (using **puppeteer** or the server rendering solution of your choice) to provide a web standards based templating solution.
- Can [support](/docs/layouts/) a static site (SSG) or server rendered site (SSR), or a hybrid of the two!  Single Page Application's (SPA) also welcome!
- Supports [further optimization](/docs/config#optimization) for additional hints like inlining or only statically pre-rendering JavaScript with no runtime cost.

Lastly, Greenwood aims to be a low point of friction as part of a standard development workflow.  In this way, there will be a balance between what tools and dependencies are considered core to Greenwood.  We aim to avoid the common "meta" framework paradigm and instead want to hone in on a lean and efficient core with good extension points for longer term maintainability and technical design.

### Plugins

The Greenwood CLI will aim to support development for all modern web standards and file types out of the box, in addition to markdown.  Otherwise, Greenwood can be extended through plugins.  In fact, Greenwood even maintains a [few of its own plugins](/plugins/) to help you get started!  In this way the Greenwood team aims to keep a strong focus on a core experience that everyone will benefit from no matter what their building, while allowing a DIY / BYOP (bring your own plugin) workflow that anyone can use.


### Browser Support

Greenwood aims to support all modern evergreen browsers out of the box and so advocates for a bundleless, untranspiled workflow by default.  For when transpilation is needed (Babel, PostCSS), Greenwood recommends using an **"evergreen build"** approach that ensures that the code delivered to users is as modern as modern as possible, with the least amount of processing and transformations applied.  Greenwood has two [plugins](/plugins/) that already supports this recommending by taking advantage of two a great tools; [**Browserslist**](https://github.com/browserslist/browserslist) and [caniuse.com](https://caniuse.com/).

- [**Babel**](https://babeljs.io/) is a compiler for JavaScript that transforms modern JavaScript down to a specific "target" of JavaScript.  For example, source code can be written using 2018+ syntax, but transformed such that browsers that don't support that syntax can still run that JavaScript.
- [**PostCSS**](https://postcss.org/), much like **Babel** is a compiler, but for CSS!  Just as with **Babel**, we can use modern CSS features without a transpilation process from a higher level version of CSS (LESS, SASS).

Using the above tools and leveraging their respective `env` presets available, essentially, **Browserlist** will query CanIUse data to determine, based on the browser query provided, what features are / aren't needed for transpilation.  This in turn allows Babel and PostCSS to intelligently transpile _only_ what's needed for the features that are missing from the browser you are targeting, thus ensuring an "evergreen" experience for users _and_ developers.  Nice. 😎

So for example, a _.browserslistrc_ that looks like this:
```shell
> 1%
not op_mini all
not ie 11
```

When run against the `browserslist`, will in turn not transpile any modern code that all these browser support.
```shell
$ npx browserslist
and_chr 67
and_uc 11.8
chrome 67
edge 17
firefox 61
ios_saf 11.3-11.4
ios_saf 11.0-11.2
safari 11.1
```