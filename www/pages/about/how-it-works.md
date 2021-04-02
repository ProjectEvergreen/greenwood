---
label: 'how-it-works'
menu: side
title: 'How It Works'
index: 1
linkheadings: 3
---

## How It Works

### Philosophy

At its heart, Greenwood is all about web standards.  With the browser becoming such a powerful tool now, especially with the advent of [ECMAScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) (ESM) now having ubiquitious support in modern browsers now, an entirely new workflow paradigm has emerged in which the browser can now be a more dependenable platform.  In this way, less tooling and depedencies are needed to achieve excellent local development workflows as well as just less overhead needed for a local development stack in general.

Greenwood wants to take advantage of this oppourtunity to join in with other projects that are re-evaluating the landscape and thinking of a more unbundled world, at least in development.  With less reliance on transpilation, and rather just some light on-the-fly transformations.  This paradigm lends itself really well to speedy local development workflows as well benefiting end users who can be shipped more modern code.  And for developers, now the code you write might actually look familiar while debugging in your browser!

### CLI

To actually use Greenwood, everyone is required to install the CLI.  The CLI is what powers all the workflows available by Greenwood and builds your project for local development and production builds.  It is plugin based so that it can be extended by users to support additional workflows not intended to be supported by core.

During _development_ the CLI will:
- Instantaneously start a local web server with live reload.
- Process requests on the fly only for the content or code you need for a given page.
- Supports loading dependencies from _node_modules_ using an [`importMap`](https://github.com/WICG/import-maps).
- We even have a plugin to tranform CommonJS into ESM (🤞)!

For _production_ builds:
- Combine all your code and dependencies into efficient modern bundles including minifying your JavaScript and CSS.
- Optimizes loading of JavaScript and CSS assets using web hints like `preload` and `prefetch`.
- All JavaScript (Web Components) are pre-rendered to static HTML (using **puppeteer**) for web standards templating with no runtime cost.
- Can [output](docs/config#mode) a standard static site (SSG), a multi-page application (MPA), or single-page application (SPA).
- Supports [further optimization](docs/config#optimization) for additional hints like inlining or only statically pre-rendering JavaScript.

Lastly, Greenwood aims to be a low point of friction as part of a standard development workflow.  In this way, there will be a balance between what tools and dependencies are considered core to Greenwood.  We aim to avoid the common "meta" framework paradigm and instead want to hone in on a lean and efficient core with good extension points for longer term maintainability and technical design.

### Plugins

The Greenwood CLI will aim to support development for all modern web standards and file types out of the box, in addition to markdown.  Otherwise, additional languages and tools can be added to extend the core development experience using Greenwood's [plugin](/plugins/) system.  In fact, Greenwood even maintains a few of its own to help you get started!  In this way the Greenwood team aims to keep a strong focus on a core experience that everyone will benefit from no matter what their building, while allowing a DIY / BYOP (bring your own plugin) workflow that anyone can use.


### Browser Support
For when transpilation is desired (Babel, PostCSS), Greenwood recommends using an **"evergreen build"** approach that ensures that the code delivered to users is as modern as modern as possible, with the least amount of processing and tranformations applied.  Greenwood has two [plugins](/plugins/) that already support taking advantage of the two amazing tools that makes this all possible; [**Browserslist**](https://github.com/browserslist/browserslist) and [caniuse.com](https://caniuse.com/).

- [**Babel**](https://babeljs.io/) is a compiler for JavaScript that transforms modern JavaScript down to a specific "target" of JavaScript.  For example, source code can be written using 2018+ syntax, but transformed such that browsers that don't support that syntax can still run that JavaScript.
- [**PostCSS**](https://postcss.org/), much like **Babel** is a compiler, but for CSS!  Just as with **Babel**, we can use modern CSS features without a transpilation process from a higher level version of CSS (LESS, SASS).  CSS has finally arrived in modern web applications! ✨

Using the above tools and leveraging their respective `env` presets available, essentially, **Browserlist** will query CanIUse data to determine, based on the browser query provided, what features are / aren't needed for transpilation.  This in turn allows Babel and PostCSS to intelligenty transpile _only_ what's needed for the features that are missing from the browser you are targatting, thus ensuring an "evergreen" experience for users _and_ developers.  Nice. 😎

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