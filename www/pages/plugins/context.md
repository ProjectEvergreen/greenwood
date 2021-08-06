---
label: 'context'
menu: side
title: 'Context'
index: 1
---

## Context

Context plugins allow users to extend where Greenwood can look for certain files and folders, like [templates and pages](/docs/layouts/).  This allows plugin authors to publish a full set of assets like HTML, CSS and images (a "theme pack") so that Greenwood users can simply "wrap up" their content in a nice custom layout and theme just by installing a package from npm!  💯  

Similar in spirit to [**CSS Zen Garden**](http://www.csszengarden.com/)

> 🔎 _For more information on developing and publishing a Theme Pack, check out [our guide on theme packs](/guides/theme-packs/)_.

## API
At present, Greenwood allows for configuring the following locations as array of (absolute) paths
- Templates directory - where additional custom page templates can be found

> _Support for pages [coming soon](https://github.com/ProjectEvergreen/greenwood/issues/681)_!

### Templates
By providing paths to directories of templates, plugin authors can share complete pages, themes, and UI complete with JavaScript and CSS to Greenwood users, and all a user has to do (besides installing the plugin), is specify a template filename in their frontmatter.

```md
---
template: 'acme-theme-blog-layout'
---

## Welcome to my blog!
```

Your plugin might look like this:
```js
/* 
 * Asssumes a (simplified) npm publishing structure like so
 * 
 * node_modules/
 *   acme-theme-pack/
 *     dist/
 *       layouts/
 *         acme-theme-blog-layout.html
 *     acme-theme-pack.js
 *     package.json
 */
const path = require('path');

module.exports = () => [{
  type: 'context',
  name: 'acme-theme-pack:context',
  provider: () => {
    return {
      templates: [
        path.join(__dirname, 'dist/layouts')
      ]
    };
  }
}];
```

> Additionally, you can provide the default _app.html_ and _page.html_ templates this way as well!