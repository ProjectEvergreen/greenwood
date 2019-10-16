# @greenwood/plugin-google-analytics

## Overview
A composite plugin for Greenwood for adding support for [Google Analytics](https://developers.google.com/analytics/) JavaScript tracker. For more information and complete docs about Greenwood, please visit the [Greenwood website](https://www.greenwoodjs.io/docs).  

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-google-analytics --save-dev

# yarn
yarn add @greenwood/plugin-google-analytics --dev
```

## Usage
Use this plugin in your _greenwood.config.js_ and simply pass in your Google Analytics ID, e.g. `UA-XXXXX`.

> As this is a composite plugin, you will need to spread the result.

```javascript
const googleAnalyticsPlugin = require('@greenwood/plugin-google-analytics');

module.exports = {
  ...

  plugins: [
    ...googleAnalyticsPlugin({
      analyticsId: 'UA-XXXXXX'
    })
  ]
}
```

This will then add the Google Analytics [JavaScript tracker snippet](https://developers.google.com/analytics/devguides/collection/analyticsjs/) to your project's _index.html_.

### Options
- `analyticsId` (required) - Your Google Analytics ID
- `anonymous` (optional) - If tracking of IPs should be done anonymously.  Defaults to `true`

### Outbound Links
For links that go outside of your domain, the global function [`getOutboundLink`](https://support.google.com/analytics/answer/7478520) is available for you to use.  

Example:
```html
<a 
  target="_blank" 
  rel="noopener" 
  @onclick="getOutboundLink('www.mylink.com'); return false;" 
  href="www.mylink.com">My Link
</a>
```