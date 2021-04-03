---
label: 'plugins'
menu: navigation
title: Plugins
index: 4
---

## Plugins

At its core, Greenwood provides a CLI to drive all the development related workflows for a Greenwood project.  The CLI aims to provide a simple interface for quickly and simply building sites from as little as markdown files.

However, for more complex sites and use cases, there will come a need to extend the default functionality of Greenwood and the standard web primitives (e.g. HTML, CSS, JS) for additional capabilities like:
- Integrating Site Analytics (Google, Snowplow)
- Building out Progressive Web App (PWA) experiences
- Consuming content from a CMS (like Wordpress, Drupal)
- Supporting additional file types, like TypeScript
- Whatever you can think of!

Greenwood aims to cater to these use cases through two approaches:
1. A plugin based architecture exposing areas of the Greenwood build that anyone can tap into.
1. A set of pre-built plugins to help facilitate some of the most common uses cases and workflows, that don't require needing to know anything about the low level APIs.


### API
Each plugin must return a function that has the following three properties:.
- `name`: A string to give your plugin a name and used for error handling and troubleshooting.
- `type`: A string to specify to Greenwood the type of plugin.  Right now the current supported plugin types are [`'resource'`](/plugins/resource/), [`'rollup'`](/plugins/rollup/), and [`'server'`](/plugins/server/).
- `provider`: A function that will be invoked by Greenwood that can accept a `compilation` param to provide read-only access to Greenwood's state and configuration.

Here is an example of creating a plugin in a _greenwood.config.js_.
```javascript
module.exports = {

  ...

  plugins: [
    ({ opt1: 'something' }) => {
      return {
        name: 'my-plugin',
        type: 'resource',
        provider: (compilation) => {
          // do stuff here
        }
      }
    }
  }]

}
```
- `options` - Passed in by users when they run the exported function:
- `compilation` - Provides read-only access to the follow objects:

#### Config
This is Greenwood's default configuration options merged with any user provided configuration options in _greenwood.config.js_.  See the [configuration docs](/docs/configuration/) for more info.

```javascript
module.exports = {

  title: 'My Blog',

  plugins: [{
    name: 'my-plugin',
    type: 'resource',
    provider: (compilation) => {
      console.log(`Title of the site is ${compilation.config.title}`);  // My Blog
    }
  }]

}
```

#### Context
This provides access to all the input / output directories and file paths Greenwood uses to build the site and output all the generated files.  Context is especially useful for copying files or writing to the build directory.

Here are paths you can get from `context`, all of which are absolute URLs:

- `outputDir`: Where Greenwood outputs the final static site
- `pagesDir`: Path to the _pages/_ directory in the user's workspace
- `projectDirectory`: Path to the root of the current project
- `scratchDir`: Path to Greenwood's temporay output file directory (`${process.cwd()}.greenwood/`)s
- `userTemplatesDir`: Path to the _templates/_ directory in the user's workspace
- `userWorkspace`: Path to the workspace directory (_src/_ by default)


Example using `context` to write to `publicDir` from _greenwood.config.js_
```javascript
const fs = require('fs');
const path = require('path');

module.exports = {

  plugins: [{
    name: 'my-plugin'
    type: 'resource',
    provider: (compilation) => {
      const { outputDir } = compilation.context;

      fs.writeFileSync(path.join(outputDir, 'robots.txt'), 'Hello World!');
    }
  }]

}
```

### Plugin Types
While each API has its own documentation section on the left sidebar of this page, here is a quick overview of the current set of Plugin APIs Greenwood supports.

#### Resource Plugins
[Resource plugins](/plugins/resource/) allow users to interact with the request and response lifecycles of files at a variety of different ways.  These lifecycles provide the ability to do things like introduce new file types, to adding hosted 3rd party scripts to your site.

#### Server Plugins
[Rollup plugins](/plugins/rollup/) allow providing Rollup plugins directly to Greenwood during the optimization part of the build command.

#### Server Plugins
[Server plugins](/plugins/server/) allow developers to start and stop custom servers as part of the **serve** lifecycle of Greenwood.  These lifecycles provide the ability to do things like start a GraphQL server, or reverse proy requests to a custom server.