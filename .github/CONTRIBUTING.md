# Contributing

## Welcome!
We're excited for your interest in Greenwood, and maybe even your contribution!

> _We encourage all contributors to have first read about the project's vision and motivation's on the website's [About page](https://www.greenwoodjs.io/about/).  Greenwood is opinionated in the sense that is designed to support development for the web platform and deliver a first class developer experience tailored around that, so that anyone can create a modern and performant website (or webapp, if you prefer). So if that page is the "why", this page is the "how"._

## Technical Design Overview

The Greenwood GitHub repository is a combination [Yarn workspace](https://classic.yarnpkg.com/en/docs/workspaces/) and [Lerna monorepo](https://github.com/lerna/lerna).  The root level _package.json_ defines the workspaces and shared tooling used throughout the project, like for linting, testing, etc.

The two main directories are:
- [_packages/_](https://github.com/ProjectEvergreen/greenwood/tree/master/packages) - Packages published to NPM under the `@greenwood/` scope
- [_www/_](https://github.com/ProjectEvergreen/greenwood/tree/master/www) - [website](https://www.greenwoodjs.io) / documentation code


> _This guide is mainly intended to walk through the **cli** package, it being the principal pacakge within the project supporting all other packages._

### CLI

The CLI is the main entry point for Greenwood, similar to how the [front-controller pattern](https://en.wikipedia.org/wiki/Front_controller) works.  When users run a command like `greenwood build`, they are effectively invoking the file _src/index.js_ within the `@greenwood/cli` package.

At a high level, this is how a command goes through the CLI:
1. Each documented command a user can run maps to a script in the _commands/_ directory.
1. Each command can invoke any number of lifecycles from the _lifecycles/_ directory.
1. Lifecycles capture specific steps needed to build a site, serve it, generate a content dependency graph, etc.


### Layout
The [layout](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src) of the CLI package is as follows:

- _index.js_ - Front controller
- _commands/_ - map to runnable userland commands
- _config/_ - Tooling configuration that Greenwood creates
- _data/_ - Custom GraphQL server and client side utilities
- _lib/_ - Customfized Local third party libraries and utility files
- _lifecycles/_ - Tasks that can be composed by commands to support the full needs of that command
- _plugins/_ - Custom defaukt plugins maintained by the CLI project
- _templates/_ - Default templates and / or pages provided by Grennwood.

We'll focus on the most important two here:


### Lifecycles
Aside from the config and graph lifecycles, all lifecycles (and config files and plugins) typically expect a compilation object to be passed in.  

Lifeycles include handling:
- starting a production or development server for a compilation
- optimizing a compilation for production
- prerendering a compilation for production
- fetching external (content) data sources


## Issues
Please make sure to have the following prepared (where applicable)
1. High Level Overview
1. For bugs, please provide steps to reproduce 
1. Code Sample
1. Links / references


## Pull Requests
Pull requests are the best!  To best help facililate contributions to the project, here are some requests:
- We generally prefer an issue be opened first, to help faciliate general discussion outside of the code review process itself and align on the ask and any expections.  However, for typos in docs and minor "chore" like tasks a PR is usually sufficient.  When in doubt, open an issue.
- For bugs, please consider reviewing the issue tracker first.
- For branching, we generally follow the convention `<issue-label>/issue-<number>-<issue-title>`, e.g. _bug/issue-12-fixed-bug-with-yada-yada-yada_
- To test the CI build scripts locally, run the `yarn` commands mentioned in the below section on CI.


## Continuous Integration
Greenwood makes active use of testing tools like [GitHub Actions](https://github.com/features/actions) and [Netlify deploy previews](https://www.netlify.com/blog/2016/07/20/introducing-deploy-previews-in-netlify/) as part of the workflow.  Each time a PR is opened, a sequence of build steps defined _.github/workflows/ci..yml_ are run:
1. Linting: `yarn lint`
1. Running unit tests: `yarn test`
1. Building the Greenwood website:  `yarn build`

A preview is also made available within the status checks section of the PR in GitHub and can be used to validate work in a live environment before having to merge.


## Local Development
To develop for the project, you'll want to follow these steps:
1. Have [NodeJS LTS](https://nodejs.org) installed (>= 12.x) and [Yarn](https://yarnpkg.com/)
1. Clone the repository
1. Run `yarn install`
1. Run `yarn lerna bootstrap`

### Scripts
The [Greenwood website](https://www.greenwoodjs.io/) is currently built by Greenwood, and all files for it are located in this repository under the [_www/_ directory](https://github.com/ProjectEvergreen/greenwood/tree/master/www) workspace.  In addition to unit tests, you will want to verify any changes by running the website locally.

Below are the development tasks available for working on this project:
- `yarn develop` - Develop for the website locally using the dev server at `localhost:1984` in your browser.
- `yarn build` - Builds the website for production.
- `yarn serve` - Builds the website for production and runs it on a local webserver at `localhost:8000`

### Packages
As mentioned above, Greenwood is organized into packages as a monorepo, managed by [Lerna](https://lerna.js.org/) and [Yarn Workspaces](https://yarnpkg.com/lang/en/docs/workspaces/).  You can find all of these in the _packages/_ directory.  Each package will manage its own:
- Dependencies
- README
- Test Cases

Lerna (specifically `lerna publish`) will be used to release all packagess under a single version.  Lerna configuration can be found in _lerna.json_.

### Dependencies
To `yarn add` / `yarn remove` packages from anything in _packages/_ or _www/_, please make sure you `cd` into the directory with the _package.json_ first.

For example
```shell
$ cd packages/cli
$ yarn add <package>
```

Yarn workspaces will automatically handle installing _node_modules_ in the appropriate directory.


## Unit Testing
[TDD](https://en.wikipedia.org/wiki/Test-driven_development) is the recommended approach for developing for Greenwood and for the style of test writing we use [BDD style testing](https://en.wikipedia.org/wiki/Behavior-driven_development); "cases".  Cases are used to capture the various configurations and expected outputs of Gre enwood when running its commands, in a way that is closer to how a user would be expecting Greenwood to work.

### Running Tests
To run tests in watch mode, use:
```shell
$ yarn test:tdd
```

To verify compliance with coverage and watermark thresholds (what CI server runs), use:
```shell
$ yarn test
```

Below are some tips to help with running / debugging tests:
- `describe.only` / `it.only`: only runs this block
- `xdescribe` / `xit`: dont run this block
- Uncomment `runner.teardown()` in a case to see the build output without it getting cleaned up post test run
- Use `new Runner(true)` get debug output from Greenwood when running tests

> **PLEASE DO NOT COMMIT ANY OF THESE ABOVE CHANGES THOUGH**

### Writing Tests
Cases follow a convention starting with the command (e.g. `build`) and and the capability and features being tested, like configuration with a particular option (e.g. `port`):
```shell
<command>.<capability>.<feature>.spec.js
```

Examples:
- _build.default.spec.js_ - Would test `greenwood build` with no config and no workspace.
- _build.config.workspace-custom.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace`
- _build.config.workspace-dev-server-port.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace` and `devServer.port` set.

### Notes
Here are some thigns to keep in mind while writing your tests, due to the asynchronous nature of Greenwwood:
- Make sure to wrap all calls to `TestBed` with `async`
- All usages of `JSDOM` should be wrapped in `async`
- Avoid arrow functions in mocha tests (e.g. `() => `) as this [can cause unexpected behaviors.](https://mochajs.org/#arrow-functions).  Just use `function` instead.

## Internet Explorer
For situations that require testing Internet Explorer or Edge browser, Microsoft provides [Virtual Machines](https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/) for various combinations of Windows and Internet Explorer versions.  [VirtualBox](https://www.virtualbox.org/) is a good platform to use for these VMs.

To test from a VM, you can
1. Run `yarn serve`
1. From the VM, open `http://10.0.2.2:8000` in the browser

You can disable plugins in _webpack.config.prod.js_ to remove production optimizations for testing purposes.


## Docker
A Docker container is available within the project to use as a development environment if you like.  It is configured to use the same image that runs as part of the project's [Continuous Integration environment](https://github.com/ProjectEvergreen/greenwood/blob/master/.github/workflows/ci.yml#L9).

First make sure you have [Docker installed](https://www.docker.com/products/docker-desktop).

Then from the root of this repository do the following:
1. Build the container: `$ docker build -t nodejs-dev .`
1. Connect to the container: `$ docker run --name greenwood -v $(pwd):/workspace -i -t nodejs-dev`
1. Now you can run all the usual commands, e.g.  
  - `$ yarn install`
  - `$ yarn build`
  - `$ yarn test`

> _This will create a 2 way binding between your host and the container, so file changes will go both ways between the [host and container](https://gist.github.com/falvarez/71298b07603d32374ceb2845c3eec997)._

When you're done with the container:
1. Exit the container: `$ exit`
1. Destroy the container: `$ docker rm greenwood`

Note: If you have issues running tests due to timeouts, you can increase the setting in [package.json](https://github.com/ProjectEvergreen/greenwood/blob/master/package.json#L23)