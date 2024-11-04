# @greenwood/init

## Overview

Init package for scaffolding out a new Greenwood project.  For more information and complete docs, please visit the [Greenwood website](https://www.greenwoodjs.dev).

## Usage

Run the `init` command to scaffold a minimal Greenwood project.

```bash
$ npx @greenwood/init@latest
```

This will then output your project files into a directory called _my-app_:

```bash
./
  .gitignore
  greenwood.config.js
  package.json
  src/
    # ...
```

## Options

### Project Name

By providing a name as the first argument, the `init` command will output the project files into a directory of the same name and configure the `name` property _package.json_.

```bash
# example
$ npx @greenwood/init@latest my-app
```