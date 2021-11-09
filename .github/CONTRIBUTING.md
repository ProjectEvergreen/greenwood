# Contributing

## Welcome!
We're excited for your interest in Greenwood, and maybe even your contribution!

> _We encourage all contributors to have first read about the project's vision and motivation's on the website's [About page](https://www.greenwoodjs.io/about/).  Greenwood is opinionated in the sense that it is designed to support development for the web platform and deliver a first class developer experience tailored around that, so that anyone can create a modern and performant website (or webapp, if you prefer) knowing just standard web fundamentals. So if that page is the "why", this page is the "how"._

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


#### Layout
The [layout](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src) of the CLI package is as follows:

- _index.js_ - Front controller
- _commands/_ - map to runnable userland commands
- _config/_ - Tooling configuration that Greenwood creates
- _data/_ - Custom GraphQL server and client side utilities
- _lib/_ - Customfized Local third party libraries and utility files
- _lifecycles/_ - Tasks that can be composed by commands to support the full needs of that command
- _plugins/_ - Custom defaukt plugins maintained by the CLI project
- _templates/_ - Default templates and / or pages provided by Grennwood.


#### Lifecycles
Aside from the config and graph lifecycles, all lifecycles (and config files and plugins) typically expect a compilation object to be passed in.  

Lifeycles include handling:
- starting a production or development server for a compilation
- optimizing a compilation for production
- prerendering a compilation for production
- fetching external (content) data sources

## Project Management

We take advantage of quite a few features on GitHub to assist in tracking issues, bugs, ideas and more for the project.  We feel that being organized not only helps the team in planning out priorities and ownership, it's also a great way to add visisbility and transparency to those following the project.

### Project Boardss

Our [sequentially named project boards](https://github.com/ProjectEvergreen/greenwood/projects) help us organize work in quartery buckets with a small handful of "top line" goals and objectives we would like to focus on for the upcoming time box.  It also serves as a catch-all for the usual work and bug fixes that happen throughout general maintenance of the project and can also yield good oppourtunities for those interested in contributing to see what we would appreciate help with the most.

### Discussions

We believe good collaboration starts with good communication.  As with most of the open source community, Greenwood is a 100% volunteer project and we understand the importance of respecting everyones [time and expectations](https://www.jason.af/setting-expectations).  Although we don't mind issues being made, unless the issue is clearly actionable and falls in-line with the motiviations and trajectory of the project, then feel free to go ahead an open a [Discussion](https://github.com/ProjectEvergreen/greenwood/discussions) first.

We encourage discussions as we believe it is better to hash out technical discussions and proposals ahead of time since coding and reviewing PRs is very time consuming and as maintainer's, we want to make sure everyone gets the time they are deserved for contributing and this helps us plan our time in advance to best ensure a smooth flow of contributions through the project.

> _Put another way, we like to think of this approach as **measure twice, cut once**._

### Issues
We like to reserve issues for features and requests that are more or less "shovel" ready.  This could include prior discussions with the team or coming over from an existing Disussion.

Our standard issue template reuests some of the following information to be prepared (where applicable)
1. High Level Overview
1. Code Sample or API Design
1. Links / references for more context

For bugs, please provide steps to reproduce and expected vs actual behavior including screenshots.


### Pull Requests
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

### NPM Scripts
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


## Testing
[TDD](https://en.wikipedia.org/wiki/Test-driven_development) is the recommended approach for developing for Greenwood and for the style of test writing we use [BDD style testing](https://en.wikipedia.org/wiki/Behavior-driven_development); "cases".  Cases are used to capture the various configurations and expected outputs of Greenwood when running its commands, in a way that mimics how a user would themselves be using Greenwood.

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

## Suppplemental Infomration

Some additional information and context to help assist with developing for and contributing to Greenwood.

### Internet Explorer / Windows
For situations that require testing Internet Explorer or Edge browser, Microsoft provides [Virtual Machines](https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/) for various combinations of Windows and Internet Explorer versions.  [VirtualBox](https://www.virtualbox.org/) is a good platform to use for these VMs.

To test from a VM, you can
1. Run `yarn serve`
1. From the VM, open `http://10.0.2.2:8000` in the browser

You can disable plugins in _webpack.config.prod.js_ to remove production optimizations for testing purposes.

### npx Testing
[`npx`](https://www.npmjs.com/package/npx) is a useful CLI utitlity bundled with NodeJS that allows users to run npm packages globally but without having to install them.

```sh
% npx http-server
Starting up http-server, serving ./public
Available on:
  http://127.0.0.1:8080
  http://192.168.1.153:8080
Hit CTRL-C to stop the server
```

It's featured on the Greenwood website [home page](https://www.greenwoodjs.io/) and in the [Quick Start guide](https://www.greenwoodjs.io/getting-started/quick-start/#command-line) as an option for using Greenwood.  There is a [spec for it](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/test/cases/build.default.quick-start-npx) to try and simulate running it.

You can use it for local development with Greenwood by using [npm link](https://docs.npmjs.com/cli/v7/commands/npm-link) to make `greenwood` available to your local CLI.
```sh
# From the root of the Greenwood repo
$ npm link

# then say in a test case folder
$ cd packages/cli/test/cases/build.default.quick-start-npx
$ npx greenwood
-------------------------------------------------------
Welcome to Greenwood (v0.14.1) ♻️
-------------------------------------------------------
Running Greenwood with the  command.

          Error: not able to detect command. try using the --help flag if
          you're encountering issues running Greenwood.  Visit our docs for more
          info at https://www.greenwoodjs.io/docs/.
```

### Docker
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

## Release Management

Lerna is used to manage the publishing of packages within the workspace.  Assuming your are logged into **npm** locally and have 2FA access to publish, the command to run is
```sh
# from the root of the repo
$ yarn lerna publish
```

Lerna should then prompt you through the steps to pick the version and all packages that will get updated.

> _Sometimes when doing pre-minor releases, it will be required to manually bump the `version` in www/package.json_