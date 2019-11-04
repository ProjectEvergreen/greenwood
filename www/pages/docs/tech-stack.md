---
menu: docs
title: Tech Stack
---

## Tech Stack

Greenwood uses a variety of open source JavaScript tools to help faciliate development and production building of Greenwood projects.  By putting all these tools together and configuring them for you, Greenwood helps you focus more on what matters; building your project.  Greenwood takes are of performance and optimizations for you and provides a static build of your project that you can host on any web server or cloud host, be it Netlify, S3 / CloudFront, Express, Apache, etc.  It's entirely up to you and what fits your workflow the best.

### NodeJS
For development, Greenwood requires **NodeJS** (LTS) to be available on the command line. This allows us (and you!) to tap into all the amazing web development tools and libraries available on npm.

To generate your site, we use [puppeteer](https://developers.google.com/web/tools/puppeteer/).

### Web Components
In addition to the native **HTMLElement**, Greenwood provides [**LitElement**](https://lit-element.polymer-project.org/) out of the box.  Although not tested, Greenwood should be compatible with just about any modern library on npm.

To assist with development, Greenwood alos provides the following by default:
- [lit-redux-router](https://github.com/fernandopasik/lit-redux-router): Routing library
- [@evergreen-wc](https://github.com/hutchgrant/evergreen-web-components) Custom Elements component library

### Webpack
Greenwood makes use of **webpack** for the local development workflow and building your application for production.  This is done through a combination of tools like **Babel** and **PostCSS**, which helps ensure Greenwood can deliver a modern and performant site for you and your users.

### Development
To assist in the project's development and maintenance, we also use these tools:
- [CircleCI](https://circleci.com/): Continuous Integration
- [Netlify](https://www.netlify.com/): Website hosting and branch previews
- [mocha](https://mochajs.org/): Test runner
