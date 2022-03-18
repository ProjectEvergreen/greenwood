---
label: 'optimizing'
menu: side
title: 'Optimizing'
index: 7
linkheadings: 3
---

## Optimizing

I've you picked up on the fact that we had been showing examples of using Web Components (JavaScript) to write static HTML, like in [the header](https://github.com/ProjectEvergreen/greenwood-getting-started/blob/master/src/components/header/header.js).

Then that was both intentional, but also means you have a keen eye!

So yes, while for something like what we demonstrated here would have technically been better done as plain HTML (and we would recommend that!), Greenwood understands the value JavaScript can bring to _generating_ HTML.  Which is the whole reason we built Greenwood in the first place. 💚

### Prerendering

Greenwood provides a default browser-based rendering solution for generating HTML from JavaScript that is specially optimized for Web Components.

By adding a _greenwood.config.js_ file at the root of your project and setting the `prerender` option to `true`
```js
export default {
  prerender: true
}
```

When running the build you will now see static HTML with the content and styles of the header component in _index.html_!
```html
<app-header>
  <style class="style-scope app-header">
    .header {
      background-color: #192a27;
      min-height: 30px;
      padding: 10px;
      font-size: 1.2rem;
    }

    /* ... */
  </style>

  <header class="header style-scope app-header">
    <div class="head-wrap style-scope app-header">
      <div class="brand style-scope app-header">
        <a href="/" class="style-scope app-header">
          <img src="/assets/greenwood-logo.png" alt="Greenwood logo" class="style-scope app-header">
          <h4 class="style-scope app-header">My Personal Blog</h4>
        </a>
      </div>
      <div class="social style-scope app-header">
        <a href="https://github.com/ProjectEvergreen/greenwood" class="style-scope app-header">
          <img src="https://img.shields.io/github/stars/ProjectEvergreen/greenwood.svg?style=social&amp;logo=github&amp;label=github" alt="Greenwood GitHub badge" class="github-badge style-scope app-header">
        </a>
      </div>
    </div>
  </header>
</app-header>
```

Awesome, now we're getting somewhere!  But, now you may point out, the JavaScript for the header is still being sent to the page from the `<script>` tag.  Wouldn't it be redundant now?  Well, glad you asked and to that we say, we got that covered there too!  Let's check out the next section. 👇

### Static Optimization

So with the above, we're now able to prerender the initial HTML content of our Web Components.  Great!  But in cases where all that is needed is a single-pass render, like in the case of this header, or a list, or logic that only needs to run once to generate the desired HTML, Greenwood provides a custom `data-` attribute that you can add to your `<script>` tags to handle just this case.
```html
<script type="module" data-gwd-opt="static" src="../components/header/header.js"></script>
```

By adding `data-gwd-opt="static"`, this `<script>` is removed from the final output of your page leaving you with all the HTML, with none of the runtime JavaScript.  Look at that network tab.  Easy!

![Greenwood Getting Started optimized](/assets/greenwood-getting-started-repo-optimized.webp)

Ok, let's [wrap this all up](/getting-started/next-steps/) and get you onto learning more about all the options and feature of using Greenwood to build your next project!