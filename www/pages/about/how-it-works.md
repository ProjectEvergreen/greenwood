---
label: 'how-it-works'
menu: side
title: 'How It Works'
index: 1
linkheadings: 3
---

## How It Works
Following similar motivations and inspirations as other [Project Evergreen](https://github.com/ProjectEvergreen/) projects like [Create Evergreen App](https://github.com/ProjectEvergreen/create-evergreen-app), Greenwood aims to provide a build and development workflow designed for the modern web and leveraging great open source projects in the NodeJS ecosystem.

Read on to learn more about how we put them all together for you!

### CLI
The [CLI](/docs/) is the engine driving Greenwood's available workflows, powered by [**webpack**](https://webpack.js.org/):
- Running the `develop` command provides a development workflow with all the features you would need like file watching and live reload, source maps, and more using **webpack-dev-server**.
- When you `build`, we run your project page by page through [**puppeteer**](https://github.com/GoogleChrome/puppeteer), which is a headless Chrome implementation available on **npm** and get the initial render as output and generate your static site page by page.  We also optimize your site's CSS and JavaScript to ensure Greenwood projects get excellent performance scores in tools like [webhint](https://webhint.io/) and [Google Lighthouse](https://developers.google.com/web/tools/lighthouse/).

This allows us to provide fine tuned workflows for both development and production but all you have to do is use the CLI.  💯

> Note: As powerful as **webpack** is, it does provide a lot of seemingly "magical" functionality out of the box, in particular its ability to use `import` to turn just about anything into a module (css, images, text files, etc).  While this is convenient at build time and for development, being able to use `import` non JavaScript assets is not part of any specification.  For this reason, we urge developers to understand what **webpack** does that _is_ spec compliant, and what it does that _isn't_.  Where possible, Greenwood will always favor a stable web platform first solution, e.g. if CSS Modules were to become a spec, Greenwood will make sure it is supported.

### Optimization
Greenwood supports a couple [different options](/docs/configuration#optimization) depending on what kind of site how you want to control the pre-rendering and bundling of your project.  Generally this comes down to if you need JavaScript to actually "run" your site.

> _Ideally, Greenwood would like to offer a [**progressive** option](https://github.com/ProjectEvergreen/greenwood/issues/354) that only ships the JavaScript you actually need at runtime automatically._  All optimzation options aim to provide the best balance of performance and achieving as close to 💯for a Lighthouse score.

#### Strict
With this setting, _no bundled JavaScript_ is shipped at all.  For true static sites with projects that are "side effect" free (e.g. not using `fetch`, `setTimeout`, etc and just need to render some static HTML, will  yield the best results in regards to [performance scores](https://developers.google.com/web/tools/lighthouse).  What you write will only be used to pre-render your application.

As a neat trick though, you can still use ["inline" JavaScript](https://github.com/ProjectEvergreen/greenwood/pull/401) that will get rendered inline in the HTML.

```javascript
import { html, LitElement } from 'lit-element';

class HomeTemplate extends LitElement {

  render() {
    return html\`
      <style>
        /* some CSS if you need it */
      </style>

      <script>
        function inlineScript() {
          alert('inline script running even in SSG mode when loading no external JS! 🎉');
        }
      </script>
      
      <div class='gwd-content-wrapper'>
        <button onclick="inlineScript()">For a good time, click here.</button>
        <entry></entry>
      </div>
    \`;
  }
}

customElements.define('page-template', HomeTemplate);
```

Caveats:
- Currently [not working during development (inside a LitElement `render` block)](https://github.com/ProjectEvergreen/greenwood/issues/413)
- Code like [`fetch` and `setTimeout` in your JavaScript will not be available](https://github.com/ProjectEvergreen/greenwood/blob/v0.8.0/www/components/banner/banner.js#L37)
- Your [CSS selectors cannot target custom elements](https://github.com/thegreenhouseio/www.thegreenhouse.io/pull/158/) (since `customElements.define` will not run)


#### SPA (default)
This option will bundle all your JavaScript, including a client side router provided by Greenwood (just like when development mode).  This will pre-render your site _and_ also ship a full "SPA" experience for your users and try and hydrate from that, but at the cost of shipping a little more JavaScript, so choose wisely!  

> THere are a some [known issues](https://github.com/ProjectEvergreen/greenwood/labels/mode%3Aspa) we are tracking at this time as we refine support for this feature.

### Evergreen Build
Greenwood promotes an "evergreen" build that ensures that the code delivered to users is as modern as the code all based on real browser usage and support statistics.  Automatically!

- [**Babel**](https://babeljs.io/) is a compiler for JavaScript that transforms modern JavaScript down to a specific "target" of JavaScript.  For example, source code can be written using 2018+ syntax, but transformed such that browsers that don't support that syntax can still run that JavaScript.
- [**PostCSS**](https://postcss.org/), much like **Babel** is a compiler, but for CSS!  Just as with **Babel**, we can use modern CSS features without a transpilation process from a higher level version of CSS (LESS, SASS).  CSS has finally arrived in modern web applications! ✨

Greenwood builds off of **Babel** and **PostCSS** by leveraging the `env` presets available for [**Babel**](https://babeljs.io/docs/en/babel-preset-env) and [**PostCSS**](https://preset-env.cssdb.org/), which are made possible courtesy of an awesome tool called [**Browserslist**](https://github.com/browserslist/browserslist).  Essentially, **Browserlist** allows querying of [CanIUse](https://caniuse.com/) data to determine, based on the browser query provided, what features are / aren't needed for transpilation.  This in turn allows **Babel** and **PostCSS** to intelligenty transpile only what's needed for the features that are missing, thus ensuring an "evergreen" experience for users _and_ developers.  Nice. 😎

So to [target modern evergreen browsers](https://github.com/babel/babel/issues/7789) for example, a _.browserslistrc_ would look like this:
```shell
> 1%
not op_mini all
not ie 11
```

When run against the `browserslist`, we can see what the support will be for that configuration will be:
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

_In this way, as browsers and usage matures, so will the generated JavaScript code, which is ideal since native features like `import` and `class` will only continue to get more performant over time as browser vendors continue to iterate on their JavaScript engines._


### Browser Support
As discussed above, Greenwood is able to leverage a build that can intelligently transpile projects to meet the widest use case of modern evergreen browsers as well as IE11!  This means your users will get the syntax their browsers understand (courtesy of [**core-js**](https://babeljs.io/docs/en/babel-preset-env#corejs)) while allowing developers to write modern code.  (Stage 2+ with some exceptions.)

The full list of support browsers supported right now is:
```shell
$ npx browserslist
and_chr 75
and_uc 12.12
chrome 75
chrome 74
edge 17
firefox 67
ie 11
ios_saf 12.2-12.3
ios_saf 12.0-12.1
safari 12.1
samsung 9.2
```

This is all essentially made possible by the amazing work of the [caniuse.com](https://caniuse.com/) which you can visit to get up to date information on what features major browsers are supporting.  The more you know! ⭐

> _It is our goal to make [IE11 / legacy browser support opt-in](https://github.com/ProjectEvergreen/greenwood/issues/224) through our Polyfills Plugin so that by default Greenwood would be exclusively "evergreen"._

### Polyfills
Unlink syntax, [polyfills](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill) are special browser API that can't be transpiled away, like `fetch` and the APIs that make up the [Web Components spec](https://www.webcomponents.org/introduction) (Custom Elements, Shadow DOM, Templates).

The good news is modern evergreen browsers like Chrome, Safari, and Firefox already support a lot of these features for Web Components right now!  Unfortunately, Edge is still lagging behind a little bit (and of course IE11 is its own story).  Here is what the current landscape of modern browser support looks like.
![web-components-browser-support](/assets/web-components-browser-support.png)

> For how to handle polyfills with Greenwood, please see our [polyfills plugin](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/plugin-polyfills)!