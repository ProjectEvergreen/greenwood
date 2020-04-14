---
index: 5
---

## Styles and Assets
Greenwood provides a couple ways to help style and theme your site.

By default Greenwood supports directory detection for the following folder names within your workspace
- _src/assets_ - Location for all your site images, fonts, JSON, etc and will be bundled automatically for you by Greenwood.
- _src/styles_ - Recommended location for your template and theme CSS files

> Be aware of the [limitations of the Shadow DOM](https://css-tricks.com/web-standards-meet-user-land-using-css-in-js-to-style-custom-elements/) with regard to which styles you can expect to apply globally vs. within a Shadow DOM.


### Theming
To enable theming through global styles, create a file in your workspace styles directory called _theme.css_,  e.g. _src/styles/theme.css_ and import it into your page templates.  Greenwood will include this in a `<style>` tag in the `<head>` of the generated pages.


#### Example
The below is an example of using _theme.css_ to load a Google font and apply a global browser reset for all pages.
```render css
/* theme.css */
@import url('//fonts.googleapis.com/css?family=Source+Sans+Pro&display=swap');

* {
  margin: 0;
  padding: 0;
  font-family: 'Source Sans Pro', sans-serif;
}
```

```render javascript
// page-template.js
import { html, LitElement } from 'lit-element';
import '../styles/theme.css';

MDIMPORT;

class PageTemplate extends LitElement {

  constructor() {
    super();
  }

  ...

}

customElements.define('page-template', PageTemplate);
```

### Shadow DOM
For any of your components and page templates, it is recommended to use the [Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) within your LitElement's `render` function.  You can also import the CSS too.

#### Example
```render javascript
import { html, LitElement } from 'lit-element';
import pageTemplateCss '../styles/page-template.css';  // if you like your CSS-in-JS

MDIMPORT;

class PageTemplate extends LitElement {

  constructor() {
    super();
  }

  render() {
    return html\`

      <style>
        ${pageTemplateCss}
      </style>

      <style>
        :host {
          h1 {
            color: blue;
            border: 1px solid #020202;
          }
        }
      </style>

      <div>

        <entry></entry>

      </div>
    \`;
  }
}

customElements.define('page-template', PageTemplate);
```

### Assets and Images
They say a picture is worth 1000 words, so by default Greenwood will look for an _assets/_ folder in your workspace and automatically copy / bundle whatever it sees there.

#### Example
To use an image in a markdown file, you would reference it as so using standard markdown syntax:

```render md
# This is my page

![my-image](/assets/images/my-image.png)
```

If you like your all-the-things-in-JS, you can also use `import` in a custom element.
```render javascript
import { html, LitElement } from 'lit-element';
import logo from '../../assets/images/logo.png';

class HeaderComponent extends LitElement {
  render() {
    return html\`
      <style>
        img {
          border-radius: 0 !important;
          min-height: 233px;
          max-height: 233px;
          object-fit: cover;
        }
      </style>

      <header>
        <h1>Welcome!</h1>
        <img alt="brand logo" src=\"${logo}\" />
      </header>
    \`;
  }
}

customElements.define('x-header', HeaderComponent);
```
