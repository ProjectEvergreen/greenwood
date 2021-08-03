---
title: 'Creating a Theme Pack'
menu: side
linkheadings: 3
index: 2
---

## Creating a Theme Pack

Introduced as a concept in the [Context Plugin docs](/plugins/context/), a theme pack is what Greenwood uses to refer to a plugin that aims to provide a set of reasuale templates, pages and more to a user (think of [**CSS Zen Garden**](http://www.csszengarden.com/)).  A good example (and the one used in this guide!) is greenwood-starter-presentation, which provides the starting point for creating a slide deck entirely from markdown, using Greenwood!

> _Support for pages [coming soon](https://github.com/ProjectEvergreen/greenwood/issues/681)_!

### Prerequistes
This guide will walk through the process of setting up Greenwood to support the developing and publishing of your package (theme pack) to npm.

To try and focus on just the theme pack aspects, this guide assumes a couple things:
- You are already familiar with [setting up](/getting-started/) a Greenwood project.
- You are familiar with [publishing packages to npm](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages).
- Assumes a Unix "like" environment (in regards to commands and file path examples used), though the same can definifitely be done on Windows.

We encourage using Greenwood to develop your theme pack mainly so that you can ensure a seamless experience when publishing to npm knowing that things should just work. ™️

### Project Setup
For the sake of development, you can create as much as you need to recreate a user workspace and to simulate what your theme pack would look like.  Think of it like creating a [Storybook](https://storybook.js.org/) for your theme pack.

For this guide, we will be publishing _templates/_ and _styles/_ to npm, and so _pages/_ will just be used as a way to pull in the template for local development and testing purposes.
```shell
src/
  pages/
    index.md
  styles/
    theme.css
  templates/
    blog-post.html
package.json
my-theme-pack.js
greenwood.config.js
```

_package.json_
```json
{
  "name": "my-theme-pack",
  "version": "0.1.0",
  "description": "My Custom Greenwood Theme Pack",
  "main": "my-theme-pack.js",
  "files": [
    "dist/"
  ]
}
```

_my-theme-pack.js_
```js
const path = require('path');

module.exports = () => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: () => {
    return {
      templates: [
        path.join(__dirname, 'dist/templates')
      ]
    };
  }
}];
```

_blog-post.html_
```html
<html>

  <head>
    <!-- reference JS or assets too! -->
    <link rel="stylesheet" href="/node_modules/my-theme-pack/dist/styles/theme.css">
  </head>

  <body>
    <!-- whatever else you want to add to the page for the user! -->
    <content-outlet></content-outlet>

  </body>

</html>
```

_theme.css_
```css
* {
  color: red
}
```

_index.md_
```md
---
template: 'blog-post'
---

# Title of blog post

Lorum Ipsum, this is a test.
```

You should then be able to run `yarn develop` and load `/` in your browser and the color of the text should be red.

You're all ready for development! 🙌

### Development

The main consideration needed for development is that your files won't be in _node_modules_, which is what the case would be for users when you publish.  So for that reason, we need to add a little boilerplate to _my-theme-pack.js_.  There might be others way to solve it, but it just checks if the packages is installed and:
1. If it _is_ installed, then use `__dirname` (which would resolve to somewhere inside _node_modules_) as the base path
1. If it _is not_ installed (like for local development) then you can use use whatever location you have defined in your repository.  Most common would just be to use `process.cwd`

So using our current example, our final _my-theme-pack.js_ would look like this:
```js
const os = require('os');
const path = require('path');
const packageJson = require('./package.json');
const { spawnSync } = require('child_process');

module.exports = () => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: () => {
    const { name } = packageJson;
    const baseDistDir = `node_modules/${name}/dist`;
    const command = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
    const ls = spawnSync(command, ['ls', name]);
    const isInstalled = ls.stdout.toString().indexOf('(empty)') < 0;

    const templateLocation = isInstalled
      ? path.join(__dirname, `${baseDistDir}/templates`)
      : path.join(process.cwd(), 'src/templates');

    return {
      templates: [
        templateLocation
      ]
    };
  }
}];
```

And our final _greenwood.config.js_ would look like this
```js
// shared from another test
const myThemePackPlugin = require('./my-theme-pack');
const packageName = require('./package.json').name;
const path = require('path');
const { ResourceInterface } = require('@greenwood/cli/src/lib/resource-interface');

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    return Promise.resolve(url.indexOf(`/node_modules/${packageName}/`) >= 0);
  }

  async resolve(url) {
    return Promise.resolve(url.replace(`/node_modules/${packageName}/dist/`, path.join(process.cwd(), '/src/')));
  }
}

module.exports = {
  plugins: [
    ...myThemePackPlugin(),
    {
      type: 'resource',
      name: 'my-theme-pack:resource',
      provider: (compilation, options) => new MyThemePackDevelopmentResource(compilation, options)
    }
  ]
};
```

> _We realize this current workflow is a bit clunky at the moment, so please follow [this discussion](https://github.com/ProjectEvergreen/greenwood/discussions/682) for ways we can try and make this more elegant!_  🙏🏻


### Publishing
When it comes to publishing, it should be fairly straightforward, you'll just want to do the following
1. Add _dist/_ to _.gitignore_ (or whatever `files` location you want to use for publishing)
1. Add a `prepublish` script to your _package.json_ to create the _dist/_ directory with all the needed _templates/_ and _styles/_
    ```json
    {
      "name": "my-theme-pack",
      "version": "0.1.0",
      "description": "My Custom Greenwood Theme Pack",
      "main": "my-theme-pack.js",
      "files": [
        "dist/"
      ],
      "scripts": {
        "prepbulish": "rm -rf dist/ && mdkir dist/ && cd src/ && cp -rv templates ../dist && cp -rv pages ../dist"
      }
    }
    ```

### Installation and Usage
With the above in place the package published, user's would just need to do the following

1. Install the plugin from npm
    ```shell
    $ npm install my-theme-pack --save-dev
    ```
1. Add the plugin to their _greenwood.config.js_ 
    ```js
    // shared with another test develop.plugins.context
    const myThemePackPlugin = require('my-theme-pack');

    module.exports = {
      plugins: [
        ...myThemePackPlugin()
      ]
    };
    ```
1. Then in any of their markdown files, users would just reference the published template's filename
    ```md
    ---
    template: 'blog-post'
    ---

    My Blog Post using Theme Packs!
    ```

Success! 🥳

> _Don't forget, user's can also [include additional CSS / JS files in their frontmatter](/docs/front-matter/#imports), to further extend, customize, and override your templates!_