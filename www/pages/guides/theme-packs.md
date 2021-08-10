---
title: 'Creating a Theme Pack'
menu: side
linkheadings: 3
index: 2
---

## Creating a Theme Pack

Introduced as a concept in the [Context Plugin docs](/plugins/context/), a theme pack is what Greenwood uses to refer to a plugin that aims to provide a set of reasuale templates, pages and more to a user (think of [**CSS Zen Garden**](http://www.csszengarden.com/)).  A good example (and the one this guide is based on) is [**greenwood-starter-presentation**](https://github.com/thescientist13/greenwood-starter-presentation), which provides the starting point for creating a [slide deck entirely from markdown](https://github.com/thescientist13/knowing-your-tco), using Greenwood!


### Prerequistes
This guide will walk through the process of setting up Greenwood to support the developing and publishing of your package (theme pack) to npm.

To try and focus on just the theme pack aspects, this guide assumes a couple things:
1. You are already familiar with [setting up](/getting-started/) a Greenwood project.
1. You are familiar with [publishing packages to npm](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages).
1. Assumes a Unix "like" environment (in regards to commands and file path examples used), though the same can definifitely be done on Windows.

We encourage using Greenwood to develop your theme pack mainly so that you can ensure a seamless experience when publishing to npm knowing that things should just work. ™️

### Project Setup
For the sake of development, you can create as much as you need to recreate a user workspace and to simulate what your theme pack would look like.  Think of it like creating a [Storybook](https://storybook.js.org/) for your theme pack.


For this guide, we will be publishing _templates/_ and _styles/_ to npm.  The _pages/_ diretory is just being used  to pull in the template for local development and testing purposes for the plugin author.
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

  <!-- we're using the npm publishing paths here which will come up again in the development section -->

  <head>
    <!-- reference JS or assets/ too! -->
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

The main consideration needed for development is that your files won't be in _node_modules_, which is what the case would be for users when you publish.  So for that reason, we need to add a little boilerplate to the _greenwood.config.js_ in your project to add a "one-off" [resource plugin](/plugins/resource/) to tell Greenwood to resolve requests to your theme pack files to the directory in your project you're using for development.
```js
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
    return Promise.resolve(this.getBareUrlPath(url).replace(`/node_modules/${packageName}/dist/`, path.join(process.cwd(), '/src/')));
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
When it comes to publishing, it should be fairly straightforward, and you'll just want to do the following:
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
        "prepublish": "rm -rf dist/ && mkdir dist/ && rsync -rv --exclude 'pages/' src/ dist"
      }
    }
    ```
1. Now, when you run `npm publish` a fresh _dist/_ folder will be made and [included in your package](https://unpkg.com/browse/greenwood-starter-presentation/)

### Installation and Usage for Users
With the above in place the package published, you're now ready to share your theme pack with other Greenwood users!

For users, they would just need to do the following:

1. Install the plugin from npm
    ```shell
    $ npm install my-theme-pack --save-dev
    ```
1. Add the plugin to their _greenwood.config.js_ 
    ```js
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

    My Blog Post using Theme Packs! 💯
    ```

Success! 🥳

> _Don't forget, user's can also [include additional CSS / JS files in their frontmatter](/docs/front-matter/#imports), to further extend, customize, and override your templates!_


### FAQ

#### _Can I include pages as part of a theme pack?_

Support for [including pages as part of a theme pack](https://github.com/ProjectEvergreen/greenwood/issues/681) is planned and coming soon, pretty much as soon as we can support [external data sources](https://github.com/ProjectEvergreen/greenwood/issues/21) in the CLI.


#### _I'm getting an (Rollup) error when trying to build or test my theme pack for production_
If you try and run `yarn build` or `yarn serve` in a repo where you are creating the theme pack, as per the guide here, you may see this error if you reference assets like `<script>`, `<link>`, etc in your templates.  ex:

```shell
prerendering complete for page /slides/7/.
prerendering complete for page /slides/6/.
prerendering complete for page /.
done prerendering all pages
Error: ENOENT: no such file or directory, open '/Users/owenbuckley/Workspace/github/repos/greenwood-starter-presentation/node_modules/greenwood-starter-presentation/dist/components/presenter-mode.js'
    at Object.openSync (fs.js:476:3)
    at Object.readFileSync (fs.js:377:35)
    at /Users/owenbuckley/Workspace/github/repos/greenwood-starter-presentation/node_modules/@greenwood/cli/src/config/rollup.config.js:185:35
    at Array.forEach (<anonymous>)
    at Object.buildStart (/Users/owenbuckley/Workspace/github/repos/greenwood-starter-presentation/node_modules/@greenwood/cli/src/config/rollup.config.js:171:23)
    at /Users/owenbuckley/Workspace/github/repos/greenwood-starter-presentation/node_modules/rollup/dist/shared/rollup.js:18870:25
    at async Promise.all (index 2)
    at async rollupInternal (/Users/owenbuckley/Workspace/github/repos/greenwood-starter-presentation/node_modules/rollup/dist/shared/rollup.js:20239:9)
    at async /Users/owenbuckley/Workspace/github/repos/greenwood-starter-presentation/node_modules/@greenwood/cli/src/lifecycles/bundle.js:12:24 {
  errno: -2,
  syscall: 'open',
  code: 'ENOENT',
  path: '/Users/owenbuckley/Workspace/github/repos/greenwood-starter-presentation/node_modules/greenwood-starter-presentation/dist/components/presenter-mode.js'
}
```

Although within your theme pack project you can use `yarn develop` to create a theme pack like any other Greenwood project, there are a couple limitations.  Mainly from your theme pack templates you must explicitely reference _node_modules/<pacakge-name>/path/to/asset/_ as the starting prefix, but we are tracking a solution and `yarn develop` should be sufficient to be able to succesfully develop and publish for now.