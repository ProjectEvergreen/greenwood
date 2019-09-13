# Contributing

## Welcome!
We're excited for your interest in Greenwood, and maybe even your contribution!

## Issues
Please make sure to have the following prepared (where applicable)
1. High Level Overview
1. For bugs, please provide steps to reproduce 
1. Code Sample
1. Links / references

## Pull Requests
Pull requests are the best!  To best help facililate contributions to the project, here are some requests:
- We generally we prefer an issue be opened first, to help faciliate general discussion outside of the code review process itself and align on the ask and any expections.  However, for typos in docs and minor "chore" like tasks a PR is usually sufficient.  When in doubt, open an issue.
- For bugs, please consider reviewing the issue tracker.
- For branching, we generally follow the convention `<issue-label>/issue-<number>-<issue-title>`, e.g. _bug/issue-12-fixed-bug-with-yada-yada-yada_
- To test the CI build scripts locally, run the `yarn` commands mentioned in the below section on CI.

## Continuous Integration
Greenwood makes active use of testing tools like [CircleCI](https://circleci.com/) and [Netlify deploy previews](https://www.netlify.com/blog/2016/07/20/introducing-deploy-previews-in-netlify/) as part of the workflow.  Each time a PR is opened, a sequence of build steps defined _.circleci/config.yml_ are run:
1. Linting: `yarn lint`
1. Running unit tests: `yarn test`
1. Building the Greenwood website:  `yarn build`

A preview is also made available within the status checks section of the PR in GitHub and can be used to validate work in a live environment before having to merge.

## Local Development
To develop for the project, you'll want to follow these steps:
1. Have [NodeJS LTS](https://nodejs.org) installed (>= 10.x) and [Yarn](https://yarnpkg.com/)
1. Clone the repository
1. Run `yarn install`
1. Run `yarn lerna bootstrap`

To test that everything was setep correctly, run `yarn build` to build a production version of the Greenwood website locally.  (website source located in _www/_) 

> Run `yarn serve` to serve a production build locally.


### Packages
Greenwood is organized into packages as a monorepo, managed by [Lerna](https://lerna.js.org/) and [Yarn Workspaces](https://yarnpkg.com/lang/en/docs/workspaces/).  You can find all of these in the _packages/_ directory.  Each package will manage its own:
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

### Testing
[TDD](https://en.wikipedia.org/wiki/Test-driven_development) is the recommended approach for developing for Greenwood and for the style of test writing we use [BDD style testing](https://en.wikipedia.org/wiki/Behavior-driven_development); "cases".  Cases are used to capture the various configurations and expected outputs of Greenwood when running its  commands, in a way that is closer to how a user would be expecting Greenwood to work.


#### Guidelines
Cases follow a convention starting with the command (e.g. `build`) and and the capability and features being tested, like configuration with a particular option (e.g. `publicPath`):
```shell
<command>.<capability>.<feature>.spec.js
```

Examples:
- _build.default.spec.js_ - Would test `greenwood build` with no config and no workspace.
- _build.config.workspace-custom.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace`
- _build.config.workspace-public-path.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace` and `publicPath` set.


#### Running Tests
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
- Uncomment `setup.teardownTestBed()` in a case to see the build output without it getting cleaned up post test run
- Use `new TestBed(true)` get debug output from Greenwood when running tests

> **PLEASE DO NOT COMMIT ANY OF THESE ABOVE CHANGES THOUGH**


### Website / Dev Server
The Greenwood website is currently built by Greenwood and all files are located in this repository (_www/_).  To develop for the website (and to test changes to packages), you can run the following
1. `yarn develop`
1. Open `localhost:1984` in your browser

From there, the dev server will watch for changes and reload as needed.

## Internet Explorer
For situations that require testing Internet Explorer or Edge browser, Microsoft [provides Virtual Machines](https://developer.microsoft.com/en-us/microsoft-edge/tools/vms/) for various combinations of Windows and Internet Explorer versions.  [VirtualBox](https://www.virtualbox.org/) is a good platform to use for these VMs.

To test from a VM, you can
1. Run `yarn serve`
1. From the VM, open `http://10.0.2.2:8000` in the browser

You can disable plugins in _webpack.config.prod.js_ to remove production optimizations for testing purposes.

> Note: `yarn develop` does not work right now with IE11 and Edge.