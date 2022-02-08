---
label: 'blog'
title: State of Greenwood (2022)
template: blog
---

# State of Greenwood (2022)

<!--
1. ~~link / excerpt from the great turning point of 2021~~
1. Looking Back (project retrospective)
    - originally inspired by MDN, Gatsby
    - our mission matured over time, when I tried to teach a friend web dev around verion 0.4.0 and realized I had still built a web first
    - led to Always Bet on HTML - https://projectevergreen.github.io/blog/always-bet-on-html/
    - HTML first, low on the "framework overhead", only need to know pages and templates
1. Link out to next steps, WCCG, etc
1. Find some image(s)
-->

<!--
1. Where We are now
    - rooted in web first though, plugins for "extra functionality"
    - Ultimate DX isn't the end goal per se, portability, maintainability and longevity are.  Sure we could create compilers and custom DSLs... OR, we could base our foundation on the browser and self impose constraints that way
    - DX shouldn't be about being "cool", it should help you understand the tradeoffs between the steak and the sizzle, the magic and the reality of the choices you are making.  The deeper and more complicated your _node_modules_ get, the higher the risk and thus more of an imperative for the tools to show what's up their sleeves.  Let's just say the coolness factor wears off quick when things break and a team is spread too thin.
    - Deceptive experiences
    - burnout is real, life is real, sustaining open source for us means making everything work together and so we want to maximize our time that we can contribute to the project to keep it around as long as possible on a solid foundation
    - plugins do extend for things like TS, PostCSS, etc, but it is intentionally not in core since we want to main DX to be lean and light, plus, technologies come and go, we can't expect to build a plugin for every custom pre / post processor.  We want to keep it simple for as long as possible.
    - External Data, Theme Packs, Inlude HTML
-->

Looking back on the last year, it was a pleasant retrsopective as it often takes time to see the span or breadth of the work you've done.  Going back a little bit further than that, about 18 months ago (at the time of this writing) when Greenwood made a pivot towards being a more [_"faithful" workbench for the web_](https://projectevergreen.github.io/blog/always-bet-on-html/), we were struggling with not only some technical concerns, but to be honest, also thinking about how we could stand out from the other projects in this space.  Going bundleless for development and adopting ESM were not new ideas, but we still found ourselves looking at the web dev landsacpe and thinking; if the _browser_ could be the the framework, _all you need is web_, right?  The implication this has on long term maintainability, knowledge sharing and retention, and just general practicality cemented our motivations even further.

Now we obviously don't mean that so literally to the point that there would be no point in even building Greenwood, but the fact of the matter is, the web probably won't "build" things like dev servers and minifiers, or CDNs and Serverless functions, but we do feel that for building a great website, for the most part, it provides quite a lot!  So why not at least see how far it can get us, and for most of the projects we build, our bet is that by levaraging the web as your framework, you and your contributors can benefit from the richness and resiliancy of the web platform.


So please endulge us for a moment as we touch upon some of the moments that we felt really stood out for us while working on Greenwood in 2021.

## The Year In Review

### Theme Packs

With Greenwood [_**Theme Packs**_](https://www.greenwoodjs.io/guides/theme-packs/), now developers and designers can create and share reusable HTML / CSS / JS as npm packages that other Greenwood users can pull into their Greenwood projects as a plugin.  It was inspired by [**CSS Zen Garden**](http://www.csszengarden.com/), which is a site aimed at showcasing the power of CSS through static HTML.

> _The HTML remains the same, the only thing that has changed is the external CSS file._

For example, think of a template for a presentation / slide deck.  There would generally be the following:
- theme (colors, fonts)
- background images and graphic
- slide layouts (title, two column, list)

As HTML, that might look like
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
    <div id="container">
      <content-outlet></content-outlet>
      <hr />
    </div>

    <script> type="module">
      // JavaScript can go here too!
    </script>
  </body>

</html>
```

For a user of a theme pack, they would just need to provide markdown that matches the template and presto!  Instant theming an layout.  💯
```md
---
template: title-card
---

# My Slide Title

<style>
  /* Overrides and customizations are super easy when it's just HTML and CSS */
  :root {
    --color-primary: red;
    --font-family: 'Comic Sans', sans-serif;
    --backgroundUrl: url('../assets/rick-roll.gif');
  }
</style>

This is my own slide content!

![my-image](/assets/my-image.png)
```

> _**Theme Packs**_ are powerful, and can encompass a full application framework as demonstrated in this [presentation template repo](https://github.com/thescientist13/greenwood-starter-presentation), and you can see [this example](https://github.com/thescientist13/knowing-your-tco) of an end user experience of a theme pack used for a presentation I gave._  Our [guide on Theme Packs](/guides/theme-packs/) can help you learn more.

### HTML Includes

Last year we created a [**custom plugin**](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-include-html) that aims to follow in the spirit of the [abandoned HTML Imports spec](https://www.html5rocks.com/en/tutorials/webcomponents/imports/) that was originally part of the initial Web Components "feature suite" and breath a little life back into it for Greenwood users.  Let's take a quick peak at what the HTML flavor of this API looks like, where you have static HTML that you want to reuse across your pages, like a global header or footer.

So given a snippet of HTML
```html
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

> You can check out the docs on how to [get more HTML out of your JS](https://github.com/ProjectEvergreen/greenwood/blob/master/packages/plugin-include-html/README.md) with this new plugin.


### HUD UI

It can be annoying during development to refresh the page and not see anything change even though your code has been saved and updated in your editor.  Greenwood understands how important it is to get fast feedback during development and nothing is worse than an error in your terminal when your deep into your browser and editor workflow.  It's just a start, but Greenwood supports detecting invalid HTML that it can't parse, and will raise a message to you in the browser with a "heads up" to let you know about it.

![HUD UI](/assets/blog-images/hud.png)

----

> This is just a sampling of the work that we point out over 2021.  You can read about all our release over in the [blog section](/blog/) of our website.

## The Year In Front of Us

As I write this now, we have just [released a significant stepping stone for Greenwood](/blog/release/v0.23.0), and hopefully the web.  With the introduction of [server-side rendering (SSR)](/docs/server-rendering/), we couldn't be more excited about the future of Web Components, going past the CDN and all the way to the edge!

> Greenwood wants to help you get more HTML from your JS!

We also hope to contribute to great community efforts around the web like through the Web Components Community Group, that can help drive standards forward for all of us:
- Declarative Shadow DOM and Custom Elements
- Native HTMLElement SSR Support
- HTML Imports

For Greenwood's roadmap specifically, we want to focus on getting to that 1.0, which for us means:
- Continued enhancments and improvements for SSR
- Native `HTMLElement` for SSR (drop hard dependency on puppeteer)
- Incorporating support for CSS / JSON modules
- Bypassing the server altogether and going straight to Serverless!
- Helping advance community protocols

## In Closing

I hope as we reviewed some of the key features we were able to accomplish in 2021, and what our sights are set on for 2022 that we have given a good overview of what Greenwood is and hopes to acomplish within the web dev community.  We love the web and love open source, and our vision for removing the friction and tools between your code and the browser is even more entrenched in us now.  Our plan is to look past the #hypegiest and instead focuses on familiar and pragmatic APIs that aim to shy away from the mountains of magic often found in the code and configuration we use in today's modern (meta) frameworks.

For us, it's great to see support for Web Components rising and we hope to be an ally and companion for all those building for the web, new or seasoned, user or spec author.

that our vision for how to develop for the web can better come to define what Greewood is as a projec.  We want to not just be a framework (and we use that term loosely when applied to ourselves) but a way to build for the web that looks past the #hypegiest and instead focuses on familiar and pragmatic APIs that aim to shy away from a lot of the magic in the code and configuration often found in today's modern (meta) frameworks.  Developing for the web isn't the burden it once was, and an honest discussion around the efforts to build around and on top of it we feel are worth having.  Looking inside your _node_modules_ or network tab should be a common exercise and you should always be asking yourself; _**could this be done simpler**_?