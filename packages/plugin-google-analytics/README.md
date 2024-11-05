# @greenwood/plugin-google-analytics

## Overview
A Greenwood plugin adding support for [Google Analytics](https://developers.google.com/analytics/) JavaScript tracker. It assumes you already have your own Tracking ID(s) and [can either filter out tracking for everything but your production environment](https://stackoverflow.com/a/1251931/417806) so that local testing doesn't interfere with production data, or use a conditional based `analyticsId` using an environment variable.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.  This package assumes you already have `@greenwood/cli` installed.

```bash
# npm
$ npm i -D @greenwood/plugin-google-analytics

# yarn
$ yarn add @greenwood/plugin-google-analytics --dev

# pnpm
$ pnpm add -D @greenwood/plugin-google-analytics
```

## Usage

Use this plugin in your _greenwood.config.js_ and pass in your Google Analytics ID, which can either be a
* Measurement ID (**recommended**): ex. `G-XXXXXX`
* Tracking ID (legacy): ex. `UA-XXXXXX`

```javascript
import { greenwoodPluginGoogleAnalytics } from '@greenwood/plugin-google-analytics';

export default {
  // ...

  plugins: [
    greenwoodPluginGoogleAnalytics({
      analyticsId: 'UA-XXXXXX'
    })
  ]
}
```

This will then add the Google Analytics [JavaScript tracker snippet](https://developers.google.com/analytics/devguides/collection/analyticsjs/) to your project's _index.html_.

> _Learn more about [Measurement and Tracking IDs](https://support.google.com/analytics/answer/9539598)_.

## Options

- `analyticsId` (required) - Your Google Analytics ID
- `anonymous` (optional) - Sets if tracking of IPs should be done anonymously.  Default is `true`

### Outbound Links

For links that go outside of your domain, the global function [`getOutboundLink`](https://support.google.com/analytics/answer/7478520) is available for you to use.

Example:
```html
<a
  target="_blank"
  rel="noopener"
  onclick="getOutboundLink('www.mylink.com');"
  href="www.mylink.com">My Link
</a>
```