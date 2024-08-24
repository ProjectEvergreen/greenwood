---
menu: side
title: 'Tech Stack'
index: 4
linkheadings: 3
---

## Tech Stack

**Greenwood** uses a handful of open source JavaScript tools to help facilitate development and production building of Greenwood projects.  By curating the minimal set of tools needed to provide a good developer experience based on modern web standards, Greenwood helps you focus more on what matters; building your project.  Greenwood takes care of the performance and optimizations for you and provides static build output that you can host on any web server or cloud host, be it Netlify, S3 / CloudFront, Express, Apache, etc.  It's entirely up to you and what fits your workflow the best.

### NodeJS
For local development or server rendered environments, Greenwood leverages **NodeJS**. This allows us (and you!) to tap into all the amazing web development tools and libraries available on **npm** as well as the stability and long term roadmap of NodeJS.

### Unified
For processing markdown, **Greenwood** taps into the unified ecosystem taking advantage of and supporting tools like **remark** and **rehype**

### Browsers

Web standards like Web Components and ES Modules, coupled with network standards like HTTP caching, makes the browser a great platform not only for the browsing experience, but for the developer experience as well.  Philosophies adopted by Greenwood like bundle-less development take full advantage of what the platform offers, so as to enable rapid development as well as ensure performant and optimized sites for users.


### Rollup
Greenwood makes use of [**Rollup**](https://rollupjs.org/) as part of build phase to optimize all the HTML / CSS and JavaScript for a given project.  This affords **Greenwood** the ability to bundle, minify and otherwise prepare the site for final deployment in the best way possible based on the code you've written.

### WCC
The Project Evergreen team has been hard at work on creating [**WCC**](https://github.com/ProjectEvergreen/wcc) as part of our commitment to providing more first-party solutions for building websites with Greenwood.


### Development
To assist in the project's development and maintenance, we also use these tools:
- [GitHub Actions](https://github.com/features/actions): Continuous Integration
- [Netlify](https://www.netlify.com/): Website hosting and branch previews
- [mocha](https://mochajs.org/): Test runner