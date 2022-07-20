---
label: 'optimizing'
menu: side
title: 'Optimizing'
index: 7
linkheadings: 3
---

## Optimizing

Going through this guide, you may have picked up on the fact that we had been showing examples of using Web Components (JavaScript) to write static HTML, like with [the footer](https://github.com/ProjectEvergreen/greenwood-getting-started/blob/master/src/components/footer/footer.js) we created earlier in [this guide](/getting-started/branding/#templating).

Then that was both intentional, but also means you have a keen eye!

So yes, while for something like what we demonstrated here would have technically been better done as plain HTML (and we would recommend that!), Greenwood understands the value JavaScript can bring to _generating_ HTML.  Which is the whole reason we built Greenwood in the first place. 💚

### Prerendering

Greenwood provides a built-in Web Component server-rendering solution for generating HTML from JavaScript that is specially optimized for Web Components, called [**WCC**](https://github.com/ProjectEvergreen/wcc).  Below is how to easily opt-in to generating pure HTML from your JS.  Static generation ftw!  

By adding a _greenwood.config.js_ file at the root of your project and setting the `prerender` option to `true`
```js
export default {
  prerender: true
}
```

Then, for each component, you will to export the `class` definition as a default export.
```js
# before
class FooterComponent extends HTMLElement {
  /* ... */
}

# after
export default class FooterComponent extends HTMLElement {
  /* ... */
}
```

Now, when running the build you will see static HTML with the content and styles of the `FooterComponent` component in the output of the _index.html_!
```html
<app-footer>
  <style>
    footer {
      color: blue;
    }
  </style>

  <footer>
    <h4>My Blog &copy;2022</h4>
  </footer>
</app-header>
```

Awesome, now we're getting somewhere!  But, now you may point out, the JavaScript for the header is still being sent to the page from the `<script>` tag.  Wouldn't it be redundant now?  Well, glad you asked and to that we say, we got that covered there too!  Let's check out the next section. 👇

### Static Optimization

So with the above, we're now able to prerender the initial HTML content of our Web Components.  Great!  But in cases where all that is needed is a single-pass render, like in the case of this footer, or a list, or basically any logic that only needs to run once to generate the desired HTML , Greenwood provides a custom `data-` attribute that you can add to your `<script>` tags to handle just this case.
```html
<script type="module" data-gwd-opt="static" src="/components/footer/footer.js"></script>
```

By adding `data-gwd-opt="static"`, this `<script>` is removed from the final output of your page leaving you with all the HTML, with none of the runtime JavaScript.  Look at that network tab.  Easy!

![Greenwood Getting Started optimized](/assets/greenwood-getting-started-repo-optimized.webp)

> _You may have also noticed we are not using Declarative Shadow DOM.  This is also intentional.  DSD is not supported in all browsers, plus this is static content we intending to generate and we don't want to ship that inside an inert `<template>` tag.  However, for interactive content that is intended to hydrate client side, then definitely!  See our [release blog post section on **WCC**](/blog/release/v0-26-0#wcc) for a little more context on this distinction._

Ok, let's [wrap this all up](/getting-started/next-steps/) and get you onto learning more about all the options and feature of using Greenwood to build your next project!