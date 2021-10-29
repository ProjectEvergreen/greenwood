# @greenwood/init

## Overview
Init package for scaffolding out a new Greenwood project.  For more information and complete docs, please visit the [Greenwood website](https://www.greenwoodjs.io/docs).

## Usage

Create a directory and then run the `init` command to scaffold a minimal Greenwood project.

```bash
mkdir my-app && cd my-app
npx @greenwood/init
```

This will then output the following
```bash
├── greenwood.config.js
├── .gitignore
├── package.json
└── src/
     └─ pages/
         └─ index.md
```

## API

### NPM Install

To automatically run `npm install` after scaffolding, pass the `--install` flag.

```bash
# example
npx @greenwood/init --install
```

### Yarn Install

To automatically run `yarn install` after scaffolding, pass the `--yarn` flag.

```bash
# example
npx @greenwood/init --yarn
```