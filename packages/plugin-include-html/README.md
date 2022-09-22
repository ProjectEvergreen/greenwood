# @greenwood/plugin-include-html

## Overview
In the spirit of the since [abandoned HTML Imports spec](https://www.html5rocks.com/en/tutorials/webcomponents/imports/) that was originally part of the init Web Components "feature suite", and given the renewed [interest in bringing it back](https://github.com/whatwg/html/issues/2791), this plugin adds experimental support to realize the HTML Includes "spec" as a build time templating system for HTML.  The goal here is to enable developers the ability to ship more static HTML while allowing the authoring context to be JavaScript **and** leveraging standard semantics and web expectations. 💚

> **Note**: I think if you want this feature in its most strictest sense of the word, I would recommend the [**<html-include>**](https://github.com/justinfagnani/html-include-element) custom element, which provides a runtime implementation of this as a Web Component.

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.

```javascript
import { greenwoodPluginIncludeHtml } from '@greenwood/plugin-include-html';

export default {
  ...

  plugins: [
    greenwoodPluginIncludeHtml()
  ]
}
```

> _It should be noted that this plugin would more or less be another way to achieve what the [`static` optimization setting](https://www.greenwoodjs.io/docs/configuration/#optimization) already does._

### `<link>` Tag (HTML only)
This is the simplest "flavor" and follows the spec more closely to address the use case where you have static HTML that you want to reuse across your pages, like a global header or footer.  The location of this file can be anywhere in your workspace, I just chose to put it in an _includes/_ directory for the sake of this example.

So given a snippet of HTML, e.g.
```html
<!-- src/includes/header.html -->
<style>
  header h1.my-include {
    text-align: center;
    color: red;
  }
</style>

<header class="my-include">
  <h1>Welcome to my website!<h1>
</header>
```

In a page template, you could then do this
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
    <style>
      header h1.my-include {
        text-align: center;
        color: red;
      }
    </style>

    <header class="my-include">
      <h1>Welcome to my website!<h1>
    </header>

    <h2>Hello 👋</h2>

  </body>

<html>
```


### Custom Element (JavaScript)
For more advanced use cases where customization of the output may need to be done in a programmatic fashion, the custom element flavor supports declaring functions for generating markup and data that Greenwood will then build the HTML for on the fly.  This effectively aims to fill the gap where just static HTML alone would not be sufficient enough.

So using the [Greenwood footer as an example](https://github.com/ProjectEvergreen/greenwood/blob/master/www/includes/footer.js), that displays the project version based on reading the contents of a _package.json_ file, create a JS file that `export`s two functions; `getTemplate` and `getData`
```js
// src/includes/footer.js
const getTemplate = async (data) => {
  return `
    <app-footer>
      <style>
        footer {
          grid-area: footer;
        }
        ...
      </style>

      <footer class="footer">
        <h4>
          <a href="/">Greenwood v${data.version}</a>
        </h4>
      </footer>
    </app-footer>
  `;
};

const getData = async () => {
  const version = require('../../package.json').version;

  return { version };
};

export {
  getTemplate,
  getData
};
```

In a page template, you can now do this
```html
<html>

  <body>
    <h2>Hello 👋</h2>

    <app-footer src="../includes/footer.js"></app-footer>
  </body>

<html>
```

And Greenwood would statically generate this
```html
<html>

  <body>
    <h2>Hello 👋</h2>

    <app-footer>
      <style>
        footer {
          grid-area: footer;
        }
      </style>

      <footer class="footer">
        <h4>
          <a href="/">Greenwood v0.19.0-alpha.2</a>
        </h4>
      </footer>
    </app-footer>
  </body>

<html>
```

> We think the JS flavor will really come to shine more when Greenwood adds support for [SSR](https://github.com/ProjectEvergreen/greenwood/issues/708), and then you could use this TECHNIQUE for displaying user / session data, or serverless at the edge!
