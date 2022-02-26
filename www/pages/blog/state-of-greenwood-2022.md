---
label: 'blog'
title: State of Greenwood (2022)
template: blog
---

# State of Greenwood (2022)

## Published: TBD

Looking back on the past year of Greenwood's development was a pleasant retrospective for us, as it often takes time to see the span or breadth of the work and effort you've put into a goal.  Going back even a little bit further than that when the team was thinking about [what sort of technical and mission focused approach to take with the project](https://projectevergreen.github.io/blog/always-bet-on-html/), the trail of PR breadcrumbs and releases since then has now helped us realize our vision of Greenwood as a _workbench for the web_.

At the time of that blog post, we were thinking introspectively in regards to not only technical direction, but also how we could ensure Greenwood would be differentiated from other projects in this space.  Going bundleless for development and adopting ESM were not new ideas, but we still found ourselves looking at the web dev landscape and thinking; what if we started from the "bottom" up with HTML, and then fanned out the workflow from there?  We wanted to be able to layer greater and greater capabilities on top of each other, but with a critical eye on _core vs plugin, longevity vs convenience, pragmatic vs popular_.  We knew though that we would never want to sacrifice that core workflow of the trusted _index.html_ file, or getting so clever that user's of Greenwood (or ourselves!) would end up back in the arms of some custom DSL over HTML, or even worse, being required to start with JavaScript just to author a basic site.  

Now we obviously don't mean this sentiment so literally or casually to the point that there would have been no reason in creating Greenwood, but the fact of the matter is, the web (probably) won't "build" things like local dev servers and minifiers, NodeJS and npm, or CDNs and serverless functions, but we do feel that the web provides quite a lot for actually creating a web project!  Maybe more than you think, and with even more on the horizon.  So why not at least see how far it can get us and optimize for that?  Our bet is that by [leveraging the web platform as your framework](/about/how-it-works/), anyone can benefit from the richness and resiliency the web provides us, now and in the future, for users and developers.

All in all, that refreshing of our mindset was just the motivation we needed to be able to now write this post, a year later, with some highlights of our work in 2021.


## The Year In Review

### Theme Packs

With Greenwood [_**Theme Packs**_](https://www.greenwoodjs.io/guides/theme-packs/), now you can create and share reusable HTML / CSS / JS as npm packages that yourself or other Greenwood users can pull into their Greenwood project as easily as a plugin.  It was inspired by [**CSS Zen Garden**](http://www.csszengarden.com/), which is a site aimed at showcasing the power of CSS through static HTML.

> _The HTML remains the same, the only thing that has changed is the contents of the CSS._

For example, think of a template for a presentation / slide deck, there would generally be the following considerations:
- Theme (colors, fonts)
- Background images and graphics
- Slide layouts (title, two column, list)

As HTML, that might look like:
```html
<!DOCTYPE html>
<html>

  <head>
    <style>
      :root {
        --color-primary: #135;
        --color-secondary: #74b238;
        --font-family: 'Optima', sans-serif;
        --font-size: 2rem;
        --backgroundUrl: url('../assets/background.jpg');
        width: 99%;
        margin: auto;
      }

      :root h1 {
        background-color: var(--color-secondary);
      }

      :root p {
        color: var(--color-primary);
        padding: 0 2rem;
      }

      :root img {
        float: left;
      }
    </style>
  </head>

  <body>
    <main>
      <content-outlet></content-outlet>
    </main>

    <script> type="module">
      // JavaScript can go here too!
    </script>
  </body>

</html>
```

For a user of a theme pack, it would only require setting the `template` in a markdown file's frontmatter that matches the template name and presto!  Instant theming.  💯
```md
---
template: title-card
---

# My Slide Title

<style>
  /* Overrides and customizations are super easy when it's just HTML and CSS! */
  :root {
    --color-primary: red;
    --font-family: 'Comic Sans', sans-serif;
    --backgroundUrl: url('../assets/rick-roll.gif');
  }
</style>

This is my own slide content!

![my-image](/assets/my-image.png)
```

![theme-pack](/assets/greenwood-starter-presentation.png)

> _You can see [this example](https://github.com/thescientist13/knowing-your-tco) of the end user experience of a theme pack I used for a presentation I gave and our [guide on Theme Packs](/guides/theme-packs/) can help you learn more._

### HTML Includes

We created this [**custom plugin**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-include-html) in an effort to carry on the spirit of the [abandoned HTML Imports spec](https://www.html5rocks.com/en/tutorials/webcomponents/imports/) that was originally part of the initial Web Components "feature suite".  We thought we could breath a little life back into it for the benefit of Greenwood users.  Let's take a quick peak at what the HTML flavor of this API looks like, where you have static HTML that you want to reuse across your pages, like a global header or footer.

So given a snippet of HTML
```html
<!-- src/includes/header.html -->
<header class="my-include">
  <h1>Welcome to my website!<h1>
</header>
```

And a page template, you could then add this `<link>` tag
```html
<html>

  <body>
    <!-- rel and href attributes would be required -->
    <link rel="html" href="/includes/header.html"></link>

    <h2>Hello 👋</h2>

  </body>

<html>
```

And Greenwood will statically generate this
```html
<html>

  <body>
    <header class="my-include">
      <h1>Welcome to my website!<h1>
    </header>

    <h2>Hello 👋</h2>

  </body>

<html>
```

> _Check out the docs on how to [use both options](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-include-html/README.md) with this plugin._

### Interpolate Frontmatter
When setting the [`interpolateFrontmatter`](/docs/configuration/#interpolate-frontmatter) flag in your _greenwood.config.js_, frontmatter in your markdown will be available in your HTML or markdown similar to how variable interpolation works in JavaScript.  Great for `<meta>` tags!

#### How It Works
So given the following frontmatter
```md
---
template: 'post'
title: 'Git Explorer'
emoji: '💡'
date: '04.07.2020'
description: 'Local git repository viewer'
image: '/assets/blog-post-images/git.png'
---
```

And enabling the feature in _greenwood.config.js_
```js
export default {
  interpolateFrontmatter: true
}
```

You access the frontmatter data in the markdown or HTML on a _per page instance_ following the convention of JavaScript [template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals), and Greenwood will interpolate those values at build time.

```md
# My Blog Post

<img src="${globalThis.page.image}" alt="Banner image for ${globalThis.page.description}">

Lorum Ipsum.
```

```html
<html>
  <head>
    <title>My Blog - ${globalThis.page.title}</title>
    <meta property="og:title" content="My Blog">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://www.myblog.dev">
    <meta property="og:image" content="https://www.myblog.dev/${globalThis.page.image}">
    <meta property="og:description" content="My Blog - ${globalThis.page.description}">
  </head>
  <body>
    <content-outlet></content-outlet>
  </body>
</html>
```

----

This is just a sampling of the work that we wanted to shout-out over the course of 2021.  You can read about all our releases over in the [blog section](/blog/) of our website.  Some honorable mentions include:
* [_Greenwood `init`_](/blog/release/v0-19-0/#new-project-scaffolding) - With the power of `npx`, quickly scaffold out a new Greenwood project right from the command line 📦
* [_External Data Sources_](/blog/release/v0-21-0/#external-data-sources) - No good Jamstack framework would be complete without the ability to pull in content from a database, CMS, or API ✍️
* [_HUD UI_](/blog/release/v0-18-0/#hud-ui) - An overlay UI that can surface build related terminal errors like invalid HTML, right in the browser!  We want to keep you in that browser /editor flow. ⚡

## The Year In Front of Us

As I write this now, we have just soft launched a significant release and stepping stone for Greenwood and our year ahead; [Server Side Rendering (SSR)](/blog/release/v0-23-0/#server-side-rendering-ssr)!  We couldn't be more excited about the future of Web Components and with work like this, we are eager to help take Web Components even further than the CDN; all the way to the edge!  In support of this feature, we also released a new API and plugin so you can try this feature out with [**Lit**](https://lit.dev/). It is all still early days, but this is what we plan to work on and refine in the year ahead and we are super excited for the potential and possibilities.

> _Greenwood wants to help you get more HTML from your JS!_

For Greenwood's roadmap specifically, we want to focus on getting to a [1.0 milestone](https://github.com/ProjectEvergreen/greenwood/milestone/3), which for us means:
- Continued enhancements and [improvements for SSR](https://github.com/ProjectEvergreen/greenwood/projects/9)
- [Native `HTMLElement` for SSR](https://github.com/ProjectEvergreen/greenwood/discussions/548) (drop hard dependency on puppeteer)
- [Incorporating support for CSS / JSON modules](https://github.com/ProjectEvergreen/greenwood/discussions/606) (import assertions)
- [Bypassing the server altogether and going straight to the edge](https://github.com/ProjectEvergreen/greenwood/discussions/626)!  (serverless)
- Continued testing and integration of [community Web Component projects](https://github.com/ProjectEvergreen/greenwood/discussions/523)

In addition to building up Greenwood, we also hope to keep contributing to great community efforts and conversations around the web platform like the [Web Components Community Group](https://github.com/w3c/webcomponents-cg) are doing, and supporting their initiatives towards pushing web standards forward.  Their [report](https://w3c.github.io/webcomponents-cg/) and presentation at least years TPAC aimed to advance specs and standards that are meaningful to all developers and users of the web, and we're here for it!  The **Lit** team is also working hard on advancing techniques for SSR that we are eager to see gain more traction.  Topics that we'll have our eye on include:
- [Declarative Shadow DOM](https://github.com/whatwg/dom/issues/831) (wider implementation)
- [HTML Modules](https://github.com/WICG/webcomponents/issues/645)
- [Declarative Custom Elements](https://github.com/WICG/webcomponents/blob/gh-pages/proposals/Declarative-Custom-Elements-Strawman.md)
- Helping advance [community protocols](https://github.com/webcomponents-cg/community-protocols) like [HMR](https://github.com/webcomponents-cg/community-protocols/issues/6) and [hydration](https://github.com/webcomponents-cg/community-protocols/issues/16)

## In Closing

I hope that as we reviewed some of the key features the team was able to accomplish in 2021, and in sharing our outlook for 2022, that we have given a good overview of what Greenwood hopes to accomplish for itself and what we hope it can contribute to the web dev community.  We love the web and we love open source, and our vision for removing the friction and tools between your code and the browser is even more entrenched in us now.

For us, it's great to see support for Web Components rising and we hope to be a champion and companion for all those building for the web, new or seasoned, user or spec author.  Naturally, the decisions we've made come with tradeoffs, as do any of the other options out there in the community, and that is important for us to highlight.  It's not necessarily about right or wrong; it's just emphasizing differing opinions and values.  But this is what is great about open source!  

> _We all think different, and so for us the more we thought about our approach and the implications this could have on long term maintainability, knowledge sharing, and just general practicality, has only cemented our motivations even further to optimize for a web first world._

We want to not only be _your workbench for the web_, but a way to build for the web that looks past the **#hypegeist** and instead emphasizes usage of web APIs in an effort to shy away where possible from the complexity and magic often found in today's modern (meta) frameworks.  Owning your code and owning your content is important to us, and developing for the web isn't the burden it once was.  We feel an honest discussion around the efforts to build around and on top of it are worth having.  Looking inside your _node_modules_ or network tab should be encouraging of you to ask yourself; _**what can the web do for me now**_? ♻️