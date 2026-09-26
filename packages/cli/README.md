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

# Deno
$ deno add --dev npm:@greenwood/cli npm:@rollup/wasm-node@^4.59.0
```

> _When running Greenwood with Deno, `@rollup/wasm-node` provides Rollup's WebAssembly implementation in place of Deno's native Node.js bindings.  It is only required for the Deno runtime and is therefore not installed automatically with `@greenwood/cli`._

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