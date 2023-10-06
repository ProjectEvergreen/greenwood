---
label: 'styles-and-assets'
menu: side
title: 'Styles and Assets'
index: 6
linkheadings: 3
---

## Styles and Assets
**Greenwood** generally does not have any opinion on how you structure your site, aside from the pre-determined _pages/_ and (optional) _templates/_ directories.  It supports all standard files that you can open in a web browser.


### Styles
Styles can be done in any standards compliant way that will work in a browser.  So just as in HTML, you can do anything you need like below:

```html
<!DOCTYPE html>
<html lang="en" prefix="og:http://ogp.me/ns#">

  <head>
    <style>
      html {
        background-color: white;
      }

      body {
        font-family: 'Source Sans Pro', sans-serif;
        line-height:1.4;
      }
    </style>

    <link rel="stylesheet" href="/styles/some-page.css"/>
  </head>

  <body>
    <!-- content goes here -->
  </body>

</html>
```

### Assets

For convenience, **Greenwood** does support an "assets" directory wherein anything included in that directory will automatically be copied into the build output directory.  This is the recommended location for all your local images, fonts, etc.  At this time, anything that is not referenced through an `import`, `@import`, `<script>`, `<style>` or `<link>` will not be handled by **Greenwood**.

#### Example
To use an image in a markdown file, you would reference it as so using standard markdown syntax:

```md
# This is my page

![my-image](/assets/images/my-image.png)
```

You can do the same in your HTML

```html
<header>
  <h1>Welcome to My Site!</h1>
  <img alt="logo" src="/assets/images/logo.png" />
</header>
```

In your JavaScript use a combination of `new URL` and `import.meta.url` which means you can put the file anywhere in your project, not just the _assets/_ directory and it will be resolved automatically!  For production builds, Greenwood will generate a unique filename for the asset as well, e.g. _logo-83bc009f.svg_.

```js
const logo = new URL('../images/logo.svg', import.meta.url);

class HeaderComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header>
        <h1>Welcome to My Site!</h1>
        <!-- handles nested routes / deeplinking, e.g. https://www.mysite.com/some/page/ -->
        <img src="${logo.pathname.replace(window.location.pathname, '/')}" alt="Greenwood logo"/>
      </header>
    `;
  }
}

customElements.define('x-header', HeaderComponent);
```

> If you like an all-the-things-in-JS approach, Greenwood can be extended with [plugins](/plugins/) to support "webpack" like behavior as seen in the below example for CSS:
>
> ```javascript
> import headerCss from './header.css';
> 
> const logo = new URL('../images/logo.svg', import.meta.url);
>
> class HeaderComponent extends HTMLElement {
>   connectedCallback() {
>     this.innerHTML = `
>       <style>
>         ${headerCss}
>       <style>
>       <header>
>         <h1>Welcome to My Site!</h1>
>         <img src="${logo.pathname.replace(window.location.pathname, '/')}" alt="Greenwood logo"/>
>       </header>
>    `;
>   }
> }
>
> customElements.define('x-header', HeaderComponent);
> ```