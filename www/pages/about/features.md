---
menu: side
index: 2
linkheadings: 3
---

## Features

### Easy Onboarding
We built Greenwood in the hopes that getting started would be easy.  By default Greenwood will build an app for you.  Just start with some HTML by adding pages and customizing layouts and you're good to go!  Greenwood makes as few assumptions as needed to deliver an optimal development experience with minimum configuration needed or work from you.

We strive to provide good documentation, intuitive developer experiences, and stable workflows.  Even if you don't know anything about ESM or Web Components, if you can learn a little markdown and some HTML / CSS, you can get started making a modern website right away!


### Modern Apps, Modern Workflows
At the heart of Greenwood is an "evergreen" build, that aims to deliver the most optimized user experience through a combination of techniques likes web hints, modern JavaScript and CSS, and sensible defaults.

For example, during development, we keep things lean and tooling free (relatively) by crawling your project's _package.json_ for all your dependencies and then generating an [`importMap`](https://github.com/WICG/import-maps) from that to resolve dependencies on the fly without the need for up front bundling. During production, we optimize and minify your code and get it ready to deploy to the web.

In addition, Greenwood wants to make server rendering a site is as easy as statically hosting it.  Through our SSR and pre-rendering mechanism for Web Components, you can ship less JavaScript and more HTML where you need it.  We're helping to take [Web Components to the Edge](https://github.com/thescientist13/web-components-at-the-edge)!

> _You can visit [this page](/about/how-it-works/) to learn more about how Greenwood works under the hood._

### Performance
We believe delivering a great user experience is above all else the most crucial element to a successful web project and part of that means performance out of the box.  Greenwood wants to help your site be one of the fastest out there and so we'll take care of all those optimizations for you, ensuring your site gets a great score in tools like [Lighthouse](https://developers.google.com/web/tools/lighthouse/), one of our primary performance benchmarking tools.

Haven't given Greenwood a try yet?  Check out our [Getting Started](/getting-started/) guide and start building your next modern web experience!  💯