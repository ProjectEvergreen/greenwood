# @greenwood/init

## Overview

The init package is for scaffolding out a new Greenwood project.  For more information and complete docs about Greenwood, please visit the [Greenwood website](https://www.greenwoodjs.dev).

## Usage

Run the `init` package to scaffold a Greenwood project from prompts.

```bash
$ npx @greenwood/init@latest
```

This will then walk you through a few prompts to help get your project configured with a name and output location, if you want to use TypeScript, your package manager preference, and more (to come).

Once the installer has completed, follow the steps to get your new Greenwood project up and running!

## Options

If you want to skip or pre-fill some of the prompts, below are some of the available options you can pass to the init CLI.  

```bash
$ npx @greenwood/init@latest --help

-------------------------------------------------------
Initialize a Greenwood Project (v0.32.0) ♻️
-------------------------------------------------------
Usage: @greenwood/init [options]

Options:
  -V, --version           output the version number
  -y, --yes               Accept all default options
  --name <name>           Name and directory location to scaffold your application with
  --ts [choice]           Optionally configure your project with TypeScript (choices: "yes", "no")
  -i, --install <choice>  Install dependencies with the package manager of your choice (choices: "npm", "pnpm",
                          "yarn", "no")
  -h, --help              display help for command
```

For example, to automatically create and name a project using TypeScript and PNPM, you could use this command

```sh
$ npx @greenwood/init@latest --name my-app --ts --install pnpm
```