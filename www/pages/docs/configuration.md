### Configuration

Custom configurations for your static site can be managed from a `greenwood.config.js` file in your project's base folder. From here you can add/edit the workspace, title, meta data for your site.

An example configuration `greenwood.config.js` file:

```render js
const path = require('path');

const META_DESCRIPTION = 'A modern and performant static site generator supporting Web Component based development';

module.exports = {
  workspace: path.join(__dirname, 'www'),
  title: 'Greenwood',
  meta: [
    { name: 'description', content: META_DESCRIPTION },
    { name: 'twitter:site', content: '@PrjEvergreen' },
    { property: 'og:title', content: 'Greenwood' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.greenwoodjs.io' },
    { property: 'og:image', content: 'https://s3.amazonaws.com/hosted.greenwoodjs.io/greenwood-logo.png' },
    { property: 'og:description', content: META_DESCRIPTION }
  ]
};
```

### Workspace

Workspace path for your project can be configured manually within your `greenwood.config.js` file.  For example, using the path library:

```render js
const path = require('path');

module.exports = {
  workspace: path.join(__dirname, 'www'),
}
```

The default workspace path is `./src`.


### Title

A title element for all pages can be configured via the `greenwood.config.js`

For example:

```render js
const path = require('path');

module.exports = {
  title: 'Greenwood Static Site'
}
```

The default workspace path is `./src`.

### PublicPath

The public path from which you want to serve your pages and assets (e.g. mysite.com/mysubsection/staticpage ) can be configured via the `greenwood.config.js`

For example:

```render js
const path = require('path');

module.exports = {
  publicpath: '/some-section/'
}
```

The default public path is `/`.


### Meta

You can set the configuration of meta tags within `greenwood.config.js` using an array of meta tag element objects.

For example:

```render js

const META_DESCRIPTION = 'A modern and performant static site generator supporting Web Component based development';

module.exports = {
  meta: [
    { name: 'description', content: META_DESCRIPTION },
    { name: 'twitter:site', content: '@PrjEvergreen' },
    { property: 'og:title', content: 'Greenwood' },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://www.greenwoodjs.io' },
    { property: 'og:image', content: 'https://s3.amazonaws.com/hosted.greenwoodjs.io/greenwood-logo.png' },
    { property: 'og:description', content: META_DESCRIPTION }
  ]
};
```

Which would be equivalent to:

```render html
<meta name="description" content="A modern and performant static..." />
<meta name="twitter:site" content="@PrjEvergreen" />
<meta property="og:title" content="Greenwood" />
<meta property="og:type" content="website" />
```