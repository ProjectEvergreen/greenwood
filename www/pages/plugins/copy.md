---
label: 'copy'
menu: side
title: 'Copy'
index: 2
---

## Copy

The copy plugins allow users to copy files around as part of the [build](/docs/#cli) command.  For example,, Greenwood uses this feature to copy all files in the user's _/assets/_ directory to final output directory automatically.  You can use this plugin to copy single files, or entire directories.

## API
This plugin supports providing an array of "location" objects that can either be files or directories.

```js
const path = require('path');

module.exports = () => [{
  type: 'copy',
  name: 'plugin-copy-some-files',
  provider: (compilation) => {
    const { context } = compilation;

    return [{
      // can only copy a file to a file
      from: path.join(context.userWorkspace, 'robots.txt'),
      to: path.join(context.outputDir, 'robots.txt')
    }, {
      // can only copy a directory to a directory
      from: path.join(context.userWorkspace, 'pdfs'),
      to: path.join(context.outputDir, 'pdfs')
    }];
  }
}];
```


> _You can see more examples in the [Greenwood repo](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src/plugins/copy)._