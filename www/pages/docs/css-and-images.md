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

For convenience, **Greenwood** does support an "assets" directory wherein anything copied into that will be present in the build output directory.  This is the recommended location for all your local images, fonts, etc.  Effectively anything that is not part of an `import`, `@import`, `<script>`, `<style>` or `<link>` will not be handled by **Greenwood**.

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


> If you like an all-the-things-in-JS approach, Greenwood can be extended with [plugins](/plugins/) to support "webpack" like behavior as seen in the below example:
>
> ```javascript
> import { html, LitElement } from 'lit';
> import headerCss from './header.css';
>
> class HeaderComponent extends LitElement {
>  render() {
>    return html`
>      <style>
>        ${headerCss}
>      <style>
>      <header>
>        <h1>Welcome to My Site!</h1>
>        <img alt="brand logo" src="${logo}" />
>      </header>
>    `;
>  }
> }
>
> customElements.define('x-header', HeaderComponent);
> ```