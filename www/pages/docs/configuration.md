## Configuration
These are all the supported configuration options in Greenwood, which you can define in a _greenwood.config.js_ file in your project's root directory.

A _greenwood.config.js_ file with default values would be:
```render js
module.exports = {
  workspace: 'src',  // path.join(process.cwd(), 'src')
  devServer: {
    port: 1984,
    host: 'http://localhost'
  },
  publicPath: '/',
  title: 'Greenwood App',
  meta: []
};
```

### Dev Server
Configration for Greenwood's development server are available using the `devServer` option.  Two options are available:
- `port`: Pick a different port when starting the dev server
- `host`: If you need to use a custom domain when developing locally (generally used along with editing an `/etc/hosts` file)

#### Example
```render js
module.exports = {
  devServer: {
    port: 8181,
    host: 'http://local.my-domain.com'
  },
}
```


### Meta
You can use the `meta` option for the configuration of [`<meta>` tags](https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML/The_head_metadata_in_HTML) within the `<head>` tag of the generated _index.html_ file.  This is epecially useful for providing text and images for social sharing and link previews like for Slack, text messages, and social media shares, in particular when using the [Open Graph](https://ogp.me/) set of tags.

#### Example
This is an example of the `meta` configuration for the Greenwood website.

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
<meta name="description" content="A modern and performant static site generator supporting Web Component based development">
<meta name="twitter:site" content="@PrjEvergreen"><meta property="og:title" content="Greenwood">
<meta property="og:type" content="website"><meta property="og:url" content="https://www.greenwoodjs.io/docs/">
<meta property="og:image" content="https://s3.amazonaws.com/hosted.greenwoodjs.io/greenwood-logo.png">
<meta property="og:description" content="A modern and performant static site generator supporting Web Component based development">
```

### Public Path
The `publicPath` options allows configuring additional URL segements to customize the [`<base href="/">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/base) for your site.

#### Example
As an example, given:
- Top level domain like: `http(s)://www.my-domain.com`
- Deployment path of: `/web`
- For a full URL of: `http(s)://www.my-domain.com/web`

Your `publicPath` configuration would be:
```render js
module.exports = {
  publicPath: '/web'
}
```

### Title
A `<title>` element for all pages can be configured with the `title` option.

#### Example
An example of configuring your app's title:
```render js
module.exports = {
  title: 'My Static Site'
}
```

### Workspace
Workspace path for your project where all your project files will be located.  You can change it by passing a string.  Using an absolute path is recommened.  

#### Example
```render js
const path = require('path');

module.exports = {
  workspace: path.join(__dirname, 'www'),
}
```