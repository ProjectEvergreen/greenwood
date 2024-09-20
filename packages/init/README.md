# @greenwood/init

## Overview

Init package for scaffolding out a new Greenwood project.  For more information and complete docs, please visit the [Greenwood website](https://www.greenwoodjs.io/docs).

## Usage

Run the `init` command to scaffold a minimal Greenwood project into a directory of your choosing.

```bash
# providing an output directory of my-app
npx @greenwood/init@latest my-app
```

This will then output your project files into a directory called _my-app_
```bash
my-app
├── .gitignore
├── greenwood.config.js
├── package.json
└── src/
     └─ ...
```

## API

### Project Name

By providing a name as the first argument, the `init` command will output the project files into a directory of the same name and configure the `name` property _package.json_.

```bash
# example
npx @greenwood/init@latest my-app
```

> _Omitting my-app will install project files into the current directory._

### Template

To scaffold your new project based on one of [Greenwood's starter templates](https://github.com/orgs/ProjectEvergreen/repositories?q=greenwood-template-&type=all&language=&sort=), pass the `--template` flag and then follow the prompts to complete the scaffolding.

```bash
# example
npx @greenwood/init@latest --template

-------------------------------------------------------
Initialize Greenwood Template ♻️
-------------------------------------------------------
? Which template would you like to use? (Use arrow keys)
❯ blog 
```

You can also pass the template you want from the CLI as well.
```bash
# example
npx @greenwood/init@latest --template=blog 
```

### NPM Install

To automatically run `npm install` after scaffolding, pass the `--install` flag.

```bash
# example
npx @greenwood/init@latest --install
```

### Yarn Install

To automatically run `yarn install` after scaffolding, pass the `--yarn` flag.

```bash
# example
npx @greenwood/init@latest --yarn
```

> _Flags can be chained together!_
> ```sh
> # This will use Yarn, install dependencies, and scaffold from the blog template
> $ npx @greenwood/init@latest --template --yarn --install
> ```