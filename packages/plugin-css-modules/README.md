# @greenwood/plugin-css-modules

## Overview

A Greenwood plugin for authoring [**CSS Modules ™️**](https://github.com/css-modules/css-modules).  It is a modest implementation of [the specification](https://github.com/css-modules/icss).  🙂

This is NOT to be confused with [CSS Module _Scripts_](https://web.dev/articles/css-module-scripts), which Greenwood already supports.

> This package assumes you already have `@greenwood/cli` installed.

## Installation

You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm i -D @greenwood/plugin-css-modules

# yarn
yarn add @greenwood/plugin-css-modules --dev
```

## Usage
Add this plugin to your _greenwood.config.js_.

```javascript
import { greenwoodPluginCssModules } from '@greenwood/plugin-css-modules';

export default {
  ...

  plugins: [
    greenwoodPluginCssModules()
  ]
}
```

## Usage

This plugin aims to cover a representative majority of the specification, though if you find missing capabilities please consider submitting an issue and / or PR!


1. First...

## Options
