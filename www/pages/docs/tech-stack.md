---
label: 'stack'
menu: side
title: 'Tech Stack'
index: 9
linkheadings: 3
---

## Tech Stack

**Greenwood** uses a variety of open source JavaScript tools to help faciliate development and production building of Greenwood projects.  By putting all these tools together and configuring them for you, Greenwood helps you focus more on what matters; building your project.  Greenwood takes care of the performance and optimizations for you and provides static build output that you can host on any web server or cloud host, be it Netlify, S3 / CloudFront, Express, Apache, etc.  It's entirely up to you and what fits your workflow the best.

### NodeJS
For development, Greenwood requires **NodeJS** (LTS) to be available on the command line. This allows us (and you!) to tap into all the amazing web development tools and libraries available on **npm** for your project.

To pre-render a site, we use [puppeteer](https://developers.google.com/web/tools/puppeteer/).

### Unified
For processing markdown, **Greenwood** taps into the unified ecosystem taking advantage of and supporting tools like **remark** and **rehype**

### Browsers

Web standards like Web Components and ES Modules, coupled with network standards like HTTP caching, makes the browser a great platfoprm not only for the browsing experience, but also for the developer experience as well.  Philosohies adopted by Greenwood like Bundleless development take full advantage of what the platform offers to enabled rapid development as well as ensure performant and optimized sites for users.


### Rollup
Greenwood makes use of [**Rollup**](https://rollupjs.org/) as part of build phase to optimize all the HTML / CSS and JavaScript for a given project.  This affords **Greenwood** the ability to bundle, minify and otherwise prepare the site for final deployement.


### Development
To assist in the project's development and maintenance, we also use these tools:
- [GitHub Actions](https://github.com/features/actions): Continuous Integration
- [Netlify](https://www.netlify.com/): Website hosting and branch previews
- [mocha](https://mochajs.org/): Test runner
