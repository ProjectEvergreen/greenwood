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

### Template

To scaffold your new project based on one of [Greenwood's starter templates](https://github.com/orgs/ProjectEvergreen/repositories?q=greenwood-template-&type=all&language=&sort=), pass the `--template` flag and then follow the prompts to complete the scaffolding.

```bash
# example
npx @greenwood/init --template

-------------------------------------------------------
Initialize Greenwood Template ♻️
-------------------------------------------------------
? Which template would you like to use? (Use arrow keys)
❯ blog 
```

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

> _Flags can be chained together!_
> ```sh
> # This will use Yarn, install dependencies, and scaffold from the blog template
> $ npx @greenwood/init --template --yarn --install
> ```