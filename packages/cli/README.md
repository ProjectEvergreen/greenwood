# @greenwood/cli

## Overview
CLI package for Greenwood.  For more information and complete docs, please visit the [Greenwood website](https://www.greenwoodjs.io/docs).

## Installation
You can use your favorite JavaScript package manager to install this package.

_examples:_
```bash
# npm
npm install @greenwood/cli --save-dev

# yarn
yarn add @greenwood/cli --dev
```

## Usage
Then in your _package.json_, you can run the CLI like so:
```javascript
"scripts": {
  "build": "greenwood build",
  "start": "greenwood develop"
}
```

- `npm run build`: generates a static build of your project
- `npm start`: starts a local development server for your project