# @greenwood/cli

## Overview

CLI package for Greenwood.  For more information and complete docs on Greenwood, please visit [our website](https://www.greenwoodjs.dev).

## Installation

Greenwood can be installed with your favorite JavaScript package manager.

```bash
# npm
$ npm i -D @greenwood/cli

# yarn
$ yarn add @greenwood/cli --dev

# pnpm
$ pnpm add -D @greenwood/cli
```

## Usage

Then in your _package.json_, add the `type` field and `scripts` for the CLI:

```json
{
  "type": "module",
  "scripts": {
    "build": "greenwood build",
    "dev": "greenwood develop",
    "serve": "greenwood serve"
  }
}
```

- `greenwood build`: Generates a production build of your project
- `greenwood develop`: Starts a local development server for your project
- `greenwood serve`: Runs a production server for a production build