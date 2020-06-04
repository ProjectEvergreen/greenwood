---
label: 'plugins'
menu: navigation
title: Plugins
index: 4
---

## Plugins

At its core, Greenwood provides a CLI to drive all the development related workflows for a Greenwood project.  The CLI aims to provide a simple interface for quickly and simply building sites from as little as markdown files.

However, for more complex sites and use cases, there will come a need to extend the default functionality of Greenwood for additional capabilities like:
- Site Analytics (Google, Snowplow)
- Progressive Web App experiences (PWA)
- Consuming content from a CMS (like Wordpress, Drupal)
- Whatever you can think of!

Greenwood aims to cater to these use cases through two approaches:
1. A plugin based architecture exposing low level "primitives" of the Greenwood build that anyone can extend.
1. A set of pre-built plugins to help facilitate some of the most common uses cases and workflows, that don't require needing to know anything about the low level APIs.


### API
Each plugin type requires two properties.
- `type`: A string to specify to Greenwood the type of plugin.  Can be one of the following values: `'index'`, `'webpack'`
- `provider`: A function that will be invoked by Greenwood during the build, determined by the `type`.  Can accept  a `compilation` param that provides read-only access to parts of Greenwood's state and configuration that can be used by a plugin.

Here is an example of creating a plugin in a _greenwood.config.js_.
```javascript
module.exports = {

  ...

  plugins: [{
    type: 'webpack',
    provider: (compilation) => {
      // do stuff here
    }
  }]

}
```

`compilation` provides read-only access to the follow objects:

#### Config
This is Greenwood's default configuration options merged with any user provided configuration options in _greenwood.config.js_.  See the [configuration docs](/docs/configuration/) for more info.

```javascript
module.exports = {

  title: 'My Blog',

  plugins: [{
    type: 'index|webpack',
    provider: (compilation) => {
      console.log(compilation.config.title);  // My Blog
    }
  }]

}
```

#### Context
This provides access to all the input / output directories and file paths Greenwood uses to build the site and output all the generated files.  Context is especially useful for copying files or writing to the build directory.

Here are paths you can get from `context`, all of which are absolute URLs:
- `scratchDir`: Greenwood's temporay output file (_.greenwood/_)
- `publicDir`: Where Greenwood outputs the final static site
- `pagesDir`: Path to the _pages/_ directory in the workspace
- `templatesDir`: Path to the _templates/_ directory in the workspace
- `userWorkspace`: Path to the workspace directory (_src/_ by default)
- `assetDir`: Path to the _assets/_ directory in the workspace

Example using `context` to write to `publicDir` from _greenwood.config.js_
```javascript
const fs = require('fs');
const path = require('path');

module.exports = {

  plugins: [{
    type: 'index|webpack',
    provider: (compilation) => {
      const outputDir = compilation.context.outputDir;

      fs.writeFileSync(path.join(outputDir, 'robots.txt'), 'Hello World!');
    }
  }]

}
```

### Types
While each API has its own documentation section on the left sidebar of this page, here is a quick overview of the current set of Plugin APIs Greenwood supports.

#### Index Hooks
It is common when working with certain libraries (3rd party or otherwise) that scripts _must_ be loaded globally and / or unbundled.  Good examples of these are analytics libraries and polyfills.  With an index hook plugin, users can leverage predefined "injection" sites to add this code to their project's _index.html_.

#### Webpack Plugins
Feel comfortable with **webpack**? Use this plugin type to pass in a **webpack** plugin directly!