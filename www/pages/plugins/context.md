---
menu: side
index: 2
---

## Context

Context plugins allow users to extend where Greenwood can look for certain files and folders, like [layouts and pages](/docs/layouts/).  This allows plugin authors to publish a full set of assets like HTML, CSS and images (a "theme pack") so that Greenwood users can simply "wrap up" their content in a nice custom layout and theme just by installing a package from npm!  💯

Similar in spirit to [**CSS Zen Garden**](http://www.csszengarden.com/)

> 🔎 _For more information on developing and publishing a Theme Pack, check out [our guide on theme packs](/guides/theme-packs/)_.

## API
At present, Greenwood allows for configuring the following locations as array of (absolute) paths
- Layouts directory - where additional custom page layouts can be found

> _We plan to expand the scope of this as use cases are identified._

### Layouts
By providing paths to directories of layouts, plugin authors can share complete pages, themes, and UI complete with JavaScript and CSS to Greenwood users, and all a user has to do (besides installing the plugin), is specify a layout filename in their frontmatter.

```md
---
layout: 'acme-theme-blog-layout'
---

## Welcome to my blog!
```

Your plugin might look like this:
```js
/*
 * For context, when your plugin is installed via npm or Yarn, import.meta.url will be /path/to/node_modules/<your-package-name>/
 *
 * You can then choose how to organize and publish your files.  In this case, we have published the layout under a _dist/_ folder, which was specified in the package.json `files` field.
 *
 * node_modules/
 *   acme-theme-pack/
 *     dist/
 *       layouts/
 *         acme-theme-blog-layout.html
 *     acme-theme-pack.js
 *     package.json
 */
export function myContextPlugin() {
  return {
    type: 'context',
    name: 'acme-theme-pack:context',
    provider: () => {
      return {
        layouts: [
          // when the plugin is installed import.meta.url will be /path/to/node_modules/<your-package>/
          new URL('./dist/layouts/', import.meta.url)
        ]
      };
    }
  };
}
```

> Additionally, you can provide the default _app.html_ and _page.html_ layouts this way as well!