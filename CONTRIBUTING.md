# Contributing

## Welcome!

We're excited for your interest in Greenwood, and maybe even your contribution!

> _We encourage all contributors to first read about the project's vision and motivation on our [website](https://www.greenwoodjs.dev/docs/introduction/)._

## Setup

To develop for the project, you'll want to follow these steps:

1. Install [NodeJS LTS](https://nodejs.org) or [NVM](https://github.com/nvm-sh/nvm) (recommended)
1. Have [Yarn 1.x](https://yarnpkg.com/) installed
1. Clone the repository
1. For NVM users, run `nvm use`
1. Run `yarn install`

## Feature Development

### Patch Package

Generally we prefer to develop new features in the context of a project, working directly within _node_modules_ and validating the behavior or fix first hand.  Since Greenwood runs on plugins, just like any other user of Greenwood, a lot can often be achieved by just creating a custom plugin in a project's _greenwood.config.js_ file.

If changes to _node_modules_ are needed, use [**patch-package**](https://www.npmjs.com/package/patch-package) to create a snapshot of those changes and provide that repo and patch along with your PR.

### Testing

#### Test Cases

Greenwood relies on a large set of test suites that are very behavior based, in that we can scaffold out a full Greenwood project, including a _greenwood.config.js_ and run any of Greenwood's commands over the project files.  Combined with mocha for testing and [**gallinago**](https://github.com/thescientist13/gallinago) for running Greenwood commands, any combination of configuration, project structure, and Greenwood command can be tested for its output.  (in other words, we favor E2E / BDD testing, as opposed to unit testing).

Here an example test case:

```js
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'node:url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Default output for index.html', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      describe('default <head> section content', function() {
        it('should have a <title> tag in the <head>', function() {
          const title = dom.window.document.querySelector('head title').textContent;

          expect(title).to.be.equal('My App');
        });

        // ...
      });
    });
  });

  after(async function() {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
```

#### Running Tests

To run tests in watch mode, use:

```shell
$ yarn test:tdd
```

To verify compliance with coverage and watermark thresholds (what CI server runs), use:

```shell
$ yarn test
$ yarn test:loaders
```

Below are some tips to help with running / debugging tests:
- `describe.only` / `it.only`: only runs this block
- `xdescribe` / `xit`: don't run this block
- Uncomment `await runner.teardown()` in a case to see the build output without it getting cleaned up post test run
- Use `new Runner(true)` get debug output from Greenwood when running tests

> **PLEASE DO NOT COMMIT ANY OF THESE ABOVE CHANGES THOUGH**

#### Code Content Testing

In some cases tests may actually check for specific build output contents to confirm certain operations like custom bundling or linking operations within the Greenwood build process worked as expected.  Keep in mind that if you change these contents as part of a test, and then Prettier formatting is run, the results may change and the test cases may fail, so just make sure to double check these contents with formatting applied first.

#### Writing Tests

Test cases follow a convention starting with the command (e.g. `build`) and and the capability and features being tested, like configuration with a particular option (e.g. `port`):

```shell
<command>.<capability>.<feature>-<modifier>.spec.js
```

Examples:
- _build.default.spec.js_ - Would test `greenwood build` with no config and no workspace.
- _build.config.workspace-custom.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace`
- _build.config.workspace-dev-server-port.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace` and `devServer.port` set.

#### Custom Loaders

Test cases that exercise custom loaders (like TypeScript, JSX plugins) for SSR and prerendering use cases, will need to do a couple things:

1. Prefix the test case directory and spec file with _loaders-_
1. Make sure to pass `true` as the second param to `Runner`
    ```js
    import { Runner } from 'gallinago';
    let runner;

    before(function() {
      // pass true as the second param here
      runner = new Runner(false, true);
    });

    await runner.runCommand(/* ... */);
    ```
1. Use the `yarn test:loaders` npm script

#### Notes

Here are some things to keep in mind while writing your tests, due to the asynchronous nature of Greenwood:
- Make sure to wrap all calls to `TestBed` with `async`
- All usages of `JSDOM` should be wrapped in `async`
- Avoid arrow functions in mocha tests (e.g. `() => `) as this [can cause unexpected behaviors.](https://mochajs.org/#arrow-functions).  Just use `function` instead.

### Dependencies

To add and remove packages for any workspace, make sure you `cd` into the directory with the _package.json_ first before running `yarn add` or `yarn remove`.

For example:

```shell
$ cd packages/cli
$ yarn add <package>
```

Yarn workspaces will automatically handle installing _node_modules_ in the appropriate directory.

### Continuous Integration

Greenwood makes active use [GitHub Actions](https://github.com/features/actions) and [Netlify deploy previews](https://www.netlify.com/blog/2016/07/20/introducing-deploy-previews-in-netlify/) as part of the workflow.  Each time a PR is opened, a sequence of build steps defined _.github/workflows/ci.yml_ are run for Linux and Windows including running tests, linting, and formatting.

A deploy preview is also made available within the status checks section of the PR in GitHub and can be used to validate work in a live environment before having to merge.

## Types

Greenwood [provides types](https://greenwoodjs.dev/docs/reference/) for a number of its key primitives (configuration, plugins, content as data) as well as for all plugins as well as JSDoc annotations where applicable.  It is important to keep in mind to updates these as features are developed and iterated upon.

Additionally, Greenwood leverages [exports maps](https://nodejs.org/api/packages.html#exports) as part of its distribution through NPM, which means (generally) every plugin should only have `main` and `exports` defined, in this convention:

```json
{
  "type": "module",
  "main": "./src/index.js",
  "exports": {
    ".": {
      "types": "./src/types/index.d.ts",
      "import": "./src/index.js"
    }
  }
}
```

Each plugin will also need to have an _index.d.ts_ file that exports types and a module definition for itself, like so:

```ts
// import the most specific plugin type relative to what your plugin uses
import type { Plugin } from "@greenwood/cli";

type SUPPORTED_THING = "A" | "B" | "C";

type FooPluginOptions = {
  bar?: SUPPORTED_THING
};

export type FooPlugin = (options?: FooPluginOptions) => [Plugin];

declare module "@greenwood/plugin-foo" {
  export const greenwoodPluginFoo: FooPlugin;
}
```

## Technical Design

The Greenwood repo is a combination of [Yarn workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) and a [Lerna monorepo](https://github.com/lerna/lerna).  The root level _package.json_ defines the workspaces and shared tooling used throughout the project, like for linting, testing, etc.

The main workspace is the [_packages/_](https://github.com/ProjectEvergreen/greenwood/tree/master/packages) directory, which is everything we publish to NPM under the **@greenwood** scope.

> _This guide is mainly intended to walk through the **cli** package; it being the principal package within the project supporting all other packages. See our website for documentation on our [Plugin APIs](https://www.greenwoodjs.dev/docs/reference/plugins-api/)._

### CLI

The CLI is the main entry point for Greenwood, similar to how the [front-controller pattern](https://en.wikipedia.org/wiki/Front_controller) works.  When users run a command like `greenwood build`, they are effectively invoking the file _src/index.js_ within the `@greenwood/cli` package.

At a high level, this is how a command goes through the CLI:
1. Each documented command a user can run maps to a script in the _commands/_ directory.
1. Each command can invoke any number of lifecycles from the _lifecycles/_ directory.
1. Lifecycles capture specific steps needed to build a site, serve it, generate a content dependency graph, etc.

#### Package Structure

The [structure](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src) of the CLI package is as follows:

- _index.js_ - Entry point for the CLI
- _commands/_ - map to runnable userland commands
- _config/_ - Tooling configuration
- _data/_ - Content as data related functionality
- _lib/_ - Custom utility and client facing files
- _lifecycles/_ - Individual tasks that can be used by commands to support a full Greenwood lifecycle
- _plugins/_ - Greenwood plugins maintained by the CLI project
- _layouts/_ - Default layouts and / or pages provided by Greenwood

#### Lifecycles

Aside from the config and graph lifecycles, all lifecycles (and config files and plugins) typically expect a compilation object to be passed in.

Lifecycle responsibilities include:
- starting a production or development server for a compilation
- optimizing a compilation for production
- prerendering a compilation for production
- fetching external (content) data sources

## Project Management

We take advantage of quite a few features on GitHub to assist in tracking issues, bugs, ideas and more for the project.  We feel that being organized not only helps the team in planning out priorities and ownership, it's also a great way to add visibility and transparency to those following the project.

### Project Boards

Our [sequentially named project boards](https://github.com/ProjectEvergreen/greenwood/projects) help us organize work into buckets that will generally include a small handful of "top line" goals and objectives we would like to focus on for that particular phase of work.  It also serves as a catch-all for the usual work and bug fixes that happens throughout general maintenance of the project.  Additionally, we leverage this as a means to shine insight into good opportunities for those interested in contributing as to what the Greenwood team would appreciate help with the most.

### Discussions

We believe good collaboration starts with good communication.  As with most of the open source community, Greenwood is a 100% volunteer project and so we understand the importance of respecting everyone's [time and expectations](https://jason.energy/setting-expectations/) when it comes to contributing and investing in a project.  Although we don't mind issues being made, unless the issue is clearly actionable and falls in-line with the motivations and trajectory of the project, then feel free to go ahead an open a [Discussion](https://github.com/ProjectEvergreen/greenwood/discussions) first.

We encourage discussions as we believe it is better to hash out technical discussions and proposals ahead of time since coding and reviewing PRs are very time consuming activities.  As maintainers, we want to make sure everyone gets the time they are desire for contributing and this this workflow helps us plan our time in advance to best ensure a smooth flow of contributions through the project.

> _Put another way, we like to think of this approach as **measuring twice, cut once**._

### Issues

We like to reserve issues for features and requests that are more or less "shovel" ready with clear implementation details at hand and a clear definition of "done".  This could include prior discussions with the team or action items coming out from an existing discussion.

Our standard issue template requests some of the following information to be prepared (where applicable)
1. High Level Overview
1. Code Sample or API Design
1. Links / references for more context

### Pull Requests

Pull requests are the best!  To best help facilitate contributions to the project, here are some requests:

- We generally prefer an issue be opened first, to help facilitate general discussion outside of the code review process itself and align on the ask and any expectations.  However, for typos in docs and minor "chore" like tasks a PR is usually sufficient.
- For PR titles, we follow a conventional commit style format of `type(area): #<issue-number> <summary of change>`, e.g. _bug(cli): #128 fixed bug with the thing_
    - where `type` generally follows the issue labels, like _feat_, _enhancement_, _bug_, _chore_, _docs_
    - where `area` generally follows package structure labels, like _cli_, _init_, _adapters_, _plugins_, etc
- To test the CI build scripts locally, run the `yarn` commands mentioned in the section in the Continuous Integration section of this document.  (basically just make sure linting, formatting, and test tasks are all passing)

## Release Management

Lerna (specifically `lerna publish`) will be used to release all packages under a single version bump.  Lerna configuration can be found in _lerna.json_ at the root of the repo.  All packages are managed using [Yarn (1.x) workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/).

Assuming you are logged into **npm** locally and have 2FA access to publish, the following workflows should be used.  Lerna should then prompt you through the steps to pick the version and all packages that will get updated.

### Dry Run

To test Lerna's publishing output to see what changes it would make, you can run Lerna in "dry run" mode using the following command:

> 🚨 !!! Make sure to cancel (Ctr+C) in the terminal when prompted with the OTP prompt for npm publishing !!!

```sh
# from the root of the repo
$ yarn lerna publish --force-publish --no-git-tag-version --no-push
```

### Alpha (Pre) Release

When working on a new minor release line, releases will be cut with an **-alpha.N** suffix / tag, e.g. **v0.33.0-alpha.1**.  This ensures that new release lines can be tested without impacting what is tagged as **latest** in NPM, leveraging NPM's concept of [dist tags](https://docs.npmjs.com/cli/v8/commands/npm-dist-tag).

To generate an alpha release, run:

```sh
# from the root of the repo
$ yarn lerna publish --force-publish --dist-tag alpha
```

> Typically you will want to select the _Custom Preminor_ option from the list, which Lerna should appropriately yield the expected version.  But double check and make sure the version bump is correct.

### Standard Release

For a formal release, e.g. **latest**, run the following command:
```sh
# from the root of the repo
$ yarn lerna publish --force-publish
```

