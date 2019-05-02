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
There are a couple various testing strategies used in greenwood
- _Unit_: Tests for as many "in memory" operations as possible.  Should refrain from filesystem manipulation and focus on trying to test as much of the code in isolation as possible.
- _Cases_: Integration / E2E like tests that run commands like `build` with various real world use case that Greenwood should support, from the perspective of a user running the tool, and will be concerned with actually creating user workspaces to smiluate a real world environemt.

Run tests using
```shell
$ yarn test
```

> Note, you can use the following to adjust how many mocha tests get run:
> - `describe.only` / `it.only`: only run this block
> - `xdescribe` / `xit`: dont run this block

### Unit Testing

### Case Testing