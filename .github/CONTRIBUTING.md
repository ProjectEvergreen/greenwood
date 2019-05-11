## Welcome!
We're excited for your interest in Greenwood, and maybe even your contribution!

## Issue Requests
Please make sure to have the following prepared (where applicable)
1. High Level Overview
1. For bugs, please provide steps to reproduce 
1. Code Sample
1. Links / references

## Pull Requests
Pull requests are the best!  To best help facililate contributions to the project, here are some requests:
- We generally we prefer an issue be opened first, to help faciliate general discussion outside of the code review process itself.
- For bugs, please consider reviewing the issue tracker
- For branch naming conventions, we generally follow the convention `<issue-type>/issue-<number>-issue-title`, e.g. _bug/issue-12-fixed-bug-with-yada-yada-yada_
- To test the CI build scripts locally, run any of the `yarn` commands in _.circleci/config.yml_

## Making Changes
To develop for the project, you'll want to follow these steps:
1. Have [NodeJS LTS](https://nodejs.org) installed (>= 10.x) and [Yarn](https://yarnpkg.com/)
1. Clone the repository
1. Run `yarn install`


## Testing
Greenwood follows [BDD style testing](https://en.wikipedia.org/wiki/Behavior-driven_development) through "cases".  Cases are used to capture the capabilities and features of Greenwood when running its various commands in a way that is close to how the user would actually expect the tool to work and so generally revolves around testing the build output of running `greenwood build`.  

### Guidelines
Cases follow a convention starting with the command (e.g. `build`) and and the capability and features being tested, like configuration with a particular option (e.g. `publicPath`):
```shell
<command>.<capability>.<feature>.spec.js
```

Examples:
- _build.default.spec.js_ - Would test `greenwood build` with no config and no workspace.
- _build.config.workspace-custom.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace`
- _build.config.workspace-public-path.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace` and `publicPath` set.

### Running Tests
To run tests in watch mode, use:
```shell
$ yarn test:tdd
```

To verify compliance with coverage and watermark thresholds (what CI server runs), use:
```shell
$ yarn test
```

Below are some tips to help with running / debugging tests
- `describe.only` / `it.only`: only runs this block
- `xdescribe` / `xit`: dont run this block
- uncomment `setup.teardownTestBed()` in a case to see the build output without it getting cleaned
- use `new TestBed(true)` get debug output from Greenwood when running tests

> **PLEASE DO NOT COMMIT ANY OF THESE ABOVE CHANGES THOUGH**