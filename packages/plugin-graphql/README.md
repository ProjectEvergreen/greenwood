# @greenwood/plugin-graphl

## Overview
A plugin for Greenwood for using GraphQL to query your content within your application.

> This package assumes you already have `@greenwood/cli` installed.

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm -i @greenwood/plugin-graphql --save-dev

# yarn
yarn add @greenwood/plugin-graphql --dev
```

## Usage
Add this plugin to your _greenwood.config.js_ and spread the `export`.

```javascript
const pluginGraphQL = require('@greenwood/plugin-graphql');

module.exports = {
  ...

  plugins: [
    ...pluginGraphQL() // notice the spread ... !
  ]
}
```

This will then allow you to use a query your content using GraphQL.

TODO