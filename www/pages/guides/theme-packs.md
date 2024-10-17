---
title: 'Creating a Theme Pack'
collection: guides
tocHeading: 3
order: 3
---

## Creating a Theme Pack

Introduced as a concept in the [Context Plugin docs](/plugins/context/), a theme pack is what Greenwood uses to refer to a plugin that aims to provide a set of reusable layouts, pages and more to a user (think of [**CSS Zen Garden**](http://www.csszengarden.com/)).  A good example (and the one this guide is based on) is [**greenwood-starter-presentation**](https://github.com/thescientist13/greenwood-starter-presentation), which provides the starting point for creating a [slide deck entirely from markdown](https://github.com/thescientist13/knowing-your-tco), using Greenwood!

![greenwood-starter-presentation](/assets/greenwood-starter-presentation.png)

### Prerequisites
This guide will walk through the process of setting up Greenwood to support the developing and publishing of your package (theme pack) to **npm**.

To try and focus on just the theme pack aspects, this guide assumes a couple things:
1. You are already familiar with [setting up](/getting-started/) a Greenwood project.
1. You are familiar with [publishing packages to npm](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages).
1. Assumes a Unix "like" environment (in regards to commands and file path examples used), though the same can definitely be done on Windows.

We encourage using Greenwood to develop your theme pack mainly so that you can ensure a seamless experience when publishing to npm knowing that things should just work. ™️

### Project Setup
For the sake of development, you can create as much as you need to recreate a user workspace and to simulate what your theme pack would look like.  Think of it like creating a [Storybook](https://storybook.js.org/) for your theme pack.


For this guide, we will be publishing _layouts/_ (layouts) and _styles/_ to **npm**.  The _pages/_ directory is just being used to pull in the layout for local development and testing purposes for you as the plugin author.
```shell
src/
  pages/
    index.md
  styles/
    theme.css
  layouts/
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
  "type": "module",
  "files": [
    "dist/"
  ]
}
```

_my-theme-pack.js_
```js
const myThemePack = () => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: () => {
    return {
      layouts: [
        // import.meta.url will be located at _node_modules/your-package/_
        // when your plugin is run in a user's project
        new URL('./dist/my-layouts/', import.meta.url)
      ]
    };
  }
}];

export {
  myThemePack
};
```

_src/layouts/blog-post.html_
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

_src/styles/theme.css_
```css
* {
  color: red
}
```

_src/pages/index.md_
```md
---
layout: 'blog-post'
---

# Title of blog post

Lorum Ipsum, this is a test.
```

### Development

The main consideration needed for development is that your files won't be in _node_modules_, which is what the case would be for users when you publish.  So for that reason, we need to add a little boilerplate to _my-theme-pack.js_.  There might be others way to solve it, but for right now, accepting a "developer only" flag can easily make the plugin pivot into local or "published" modes.

1. If the flag _is_ passed, then use `new URL('.', import.meta.url)` (which would resolve to the package's location inside _node_modules_) as the base path
1. If the flag _is not_ installed (like we want for local development) then you can use use whatever location you have defined in your repository.  Most common would just be to use `process.cwd`

So using our current example, our final _my-theme-pack.js_ would look like this:
<!-- eslint-disable no-underscore-dangle -->
```js
const myThemePackPlugin = (options = {}) => [{
  type: 'context',
  name: 'my-theme-pack:context',
  provider: (compilation) => {
    // you can use other directory names besides layouts/ this way!
    const layoutLocation = options.__isDevelopment
      ? new URL('./layouts/', compilation.context.userWorkspace)
      : new URL('dist/layouts/', import.meta.url);

    return {
      layouts: [
        layoutLocation
      ]
    };
  }
}];

export {
  myThemePackPlugin
};
```

And our final _greenwood.config.js_ would look like this, which adds a "one-off" [resource plugin](/plugins/resource/) to tell Greenwood to route requests to your theme pack files away from _node_modules+ and to the location of your projects files for development.

Additionally, we make sure to pass the flag from above for `__isDevelopment` to our plugin.
```js
// shared from another test
import { myThemePackPlugin } from './my-theme-pack.js';
import fs from 'fs';
import { ResourceInterface } from '@greenwood/cli/src/lib/resource-interface.js';

const packageName = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).name;

class MyThemePackDevelopmentResource extends ResourceInterface {
  constructor(compilation, options) {
    super(compilation, options);
    this.extensions = ['*'];
  }

  async shouldResolve(url) {
    const { pathname } = url;
    // eslint-disable-next-line no-underscore-dangle
    return process.env.__GWD_COMMAND__ === 'develop' && pathname.indexOf(`/node_modules/${packageName}/`) >= 0;
  }

  async resolve(url) {
    const { userWorkspace } = this.compilation.context;
    const filePath = this.getBareUrlPath(url).split(`/node_modules/${packageName}/dist/`)[1];
    const params = searchParams.size > 0
      ? `?${searchParams.toString()}`
      : '';

    return new URL(`./${filePath}${params}`, userWorkspace, filePath);
  }
}

export default {
  plugins: [
    ...myThemePackPlugin({
      __isDevelopment: true
    }),
    {
      type: 'resource',
      name: 'my-theme-pack:resource',
      provider: (compilation, options) => new MyThemePackDevelopmentResource(compilation, options)
    }
  ]
};
```

You should then be able to run `yarn develop` and load `/` in your browser and the color of the text should be red.

You're all ready for development now! 🙌

### Production Testing
You can also use Greenwood to test your theme pack using a production build so that you can run `greenwood build` or `greenwood serve` to validate your work.  To do so requires just one additional script to your _package.json_ to put your theme pack files in the _node_modules_ where Greenwood would assume them to be.  Just call this before `build` or `serve`.
```json
{
  "scripts": {

    "build:pre": "mkdir -pv ./node_modules/greenwood-starter-presentation/dist && rsync -rv --exclude 'pages/' ./src/ ./node_modules/greenwood-starter-presentation/dist",

    "build": "npm run build:pre && greenwood build",
    "serve": "npm run build:pre && greenwood serve"

  }
}
```

### Publishing
When it comes to publishing, it should be fairly straightforward, and you'll just want to do the following:
1. Add _dist/_ to _.gitignore_ (or whatever `files` location you want to use for publishing)
1. Add a `prepublish` script to your _package.json_ to create the _dist/_ directory with all the needed _layouts_ (layouts) /_ and _styles/_
    ```json
    {
      "name": "my-theme-pack",
      "version": "0.1.0",
      "description": "My Custom Greenwood Theme Pack",
      "main": "my-theme-pack.js",
      "type": "module",
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
With the above in place and the package published, you're now ready to share your theme pack with other Greenwood users!

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
1. Then in any of their markdown files, users would just need to reference the published layout's filename
    ```md
    ---
    layout: 'blog-post'
    ---

    My Blog Post using Theme Packs! 💯
    ```

Success! 🥳

> _Don't forget, user's can also [include additional CSS / JS files in their frontmatter](/docs/front-matter/#imports), to further extend, customize, and override your layouts!_


### FAQ

#### _Can I include pages as part of a theme pack?_

Support for [including pages as part of a theme pack](https://github.com/ProjectEvergreen/greenwood/issues/681) is planned and coming soon, pretty much as soon as we can support [external data sources](https://github.com/ProjectEvergreen/greenwood/issues/21) in the CLI.


#### _Will there be less development boilerplate in the future for plugin authors?_

Yes, we do realize this current workflow is a bit clunky at the moment, so please follow [this discussion](https://github.com/ProjectEvergreen/greenwood/discussions/682) for ways we can try and make this more elegant!  🙏🏻


#### Why can't I just use relative paths in my layouts to help avoid the boilerplate?

ex.
```html
<html>

  <!-- we're using the npm publishing paths here which will come up again in the development section -->

  <head>
    <!-- reference JS or assets/ too! -->
    <link rel="stylesheet" href="../styles/theme.css">
  </head>

  <body>
    ...
  </body>

</html>
```

Good question!  We tried that approach initially as it would help alleviate the open issues and needing to work around local development vs published development identified above, but the issue that was faced was that relative paths like the above [don't preserve their location / context on disk](https://github.com/ProjectEvergreen/greenwood/issues/689#issuecomment-895519561) when coming through the development server
```html
# with explicit path that includes node_modules (is exactly the same)
url -> /node_modules/my-theme-pack/dist/styles/theme.css

# with relative paths
url -> < pagesDir >/styles/theme.css
```

And so at this time Greenwood only looks in the user's workspace, not in _node_modules) and so it will `404`.