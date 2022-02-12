---
label: 'Server'
menu: side
title: 'Server'
index: 6
---

## Server

Server plugins allow developers to start and stop custom servers as part of the serve lifecycle of Greenwood.  These lifecycles provide the ability to do things like:
- Start a live reload server (like Greenwood does by default)
- Starting a GraphQL server
- Reverse proxy to help route external requests

### API (Server Interface)
Although JavaScript is loosely typed, a [server "interface"](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/lib/server-interface.js) has been provided by Greenwood that you can use to start building your own server plugins.  Effectively you just have to provide two methods
- `start` - function to run to start your server
- `stop`  - function to run to stop / teardown your server


They can be used in a _greenwood.config.js_ just like any other plugin type.
```javascript
import { myServerPlugin } from './my-server-plugin.js';

export default {

  ...

  plugins: [
    myServerPlugin()
  ]

}
```

## Example
The below is an excerpt of [Greenwood's internal LiveReload server](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/plugins/server/plugin-livereload.js) plugin.

```javascript
class LiveReloadServer extends ServerInterface {
  constructor(compilation, options = {}) {
    super(compilation, options);

    this.liveReloadServer = livereload.createServer({ /* options */});
  }

  async start() {
    const { userWorkspace } = this.compilation.context;

    return this.liveReloadServer.watch(userWorkspace, () => {
      console.info(`Now watching directory "${userWorkspace}" for changes.`);
      return Promise.resolve(true);
    });
  }
}

export function myServerPlugin(options = {}) {
  return {
    type: 'server',
    name: 'plugin-livereload',
    provider: (compilation) => new LiveReloadServer(compilation, options)
  }
};
```