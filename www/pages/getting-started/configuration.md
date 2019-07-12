## Configuration

A configuration file can be added to your project workspace with a file named `greenwood.config.js`.

Within this file you can set a custom workspace directory and configure meta data.

### Workspace

By default, the workspace folder `src` will contain your project structure. However, you may wish to use a custom folder name.

For example, you could use `www` as your main source directory:

`greenwood.config.js`
```render js
const path = require('path');

module.exports = {
  workspace: path.join(__dirname, 'www'),
};
```

### Meta

You can configure title and meta elements from the greenwood configuration file.

`greenwood.config.js`

```render js
module.exports = {
  title: 'Greenwood',
  meta: [
    { property: 'og:site', content: 'greenwood' },
    { name: 'twitter:site', content: '@PrjEvergreen' }
  ]
};
```