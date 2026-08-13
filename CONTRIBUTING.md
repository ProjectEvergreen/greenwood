# Contributing

## Welcome!

We're excited for your interest in Greenwood, and maybe even your contribution!

> 💡 _We encourage all contributors to first read about the project's vision and motivation on our [website](https://www.greenwoodjs.dev/docs/introduction/)._

## Setup

To contribute to the project, you'll want to follow these steps:

1. Install [NodeJS LTS](https://nodejs.org) or [NVM](https://github.com/nvm-sh/nvm) (recommended)
1. Have [Yarn 1.x](https://yarnpkg.com/) installed
1. Clone the repository
1. For NVM users, run `nvm use`
1. Run `yarn install`
1. For Windows developers, run `npx puppeteer browsers install chrome`

## Values

To help set expectations for contributing to Greenwood, we would like to share a few of the core values we find meaningful to our project and to open source in general:

- We value human interaction above all else.  We expect human authored content when collaborating in issues, discussions, and PRs
- If you are new to the project, please considering engaging in a [good first issue](https://github.com/ProjectEvergreen/greenwood/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22)
- Feature requests should come from a clearly defined user-land need that is demonstrable and that is not currently possible through plugins alone. (if you feel otherwise, please open a discussion first)
- When requesting a feature or reporting a bug, always consider the developer experience first, and design or advocate with perspective in mind.  In other words, a compelling case should be made on the merits of the issue itself, without the need for heavy up-front implementation or spec design.  We can all relate to a well designed API, regardless of how it was implemented under the hood.
- Comments in code should be used sparingly, for cases where the "why" is not obvious, like edge cases or runtime specific quirks.  Excessive / obvious commenting is not valuable and will be asked to be removed.

----

On the topic of LLMs...

While we appreciate the value AI can bring to research and exploration, finding bugs, and uncovering security issues, contributions made with AI are still required to follow the principles outlined above.  Even more so when engaging in communications with the team like issues, PRs, or discussions.  We want to be talking to _you_, **not** the agent. LLM generated text is overly verbose and robotic, which adds more burden on the reader.

As LLMs should not "speak" for you, they should not "think" for you either.  Only submit code that you understand and can explain in your own words, which we hope are a lot less than an LLM!  (and feels more natural to read, too)

Use of LLM interactions or use of AI assistants to automate your participation in the project may result in your issues or PRs being denied.

LLM usage for **good first issues** will be rejected, as that defeats the goal of this category of issues.  We want them specifically reserved for new contributors to the project as a way for them to get to learn the codebase and start contributing to open source.

> 💚 _In general, be mindful of your contributions and the volume at which you are engaging with the project.  Time is limited and we want to make sure we can get to everyone's needs in a fair and balanced manner._

## Contributions

Generally we prefer to develop new features in the context of a project or direct use case, working directly within _node_modules_ and validating the value, behavior, or fix first hand.  Since Greenwood runs on [plugins](https://greenwoodjs.dev/docs/reference/plugins-api/) though, a lot can often be achieved by just creating a custom plugin!  Keep this in mind when considering if a feature needs to go in core.  If in doubt, feel free to open a discussion.

> 🗒️ _If changes to `node_modules` are needed, use [**patch-package**](https://www.npmjs.com/package/patch-package) (or similar feature if your package manager supports it) to create a snapshot of those changes and provide that repo and patch for consideration._

### Discussions

We believe good collaboration starts with good communication.  As with most of the open source community, Greenwood is a 100% volunteer project and so we understand the importance of respecting everyone's [time and expectations](https://jason.energy/setting-expectations/) when it comes to contributing and investing in a project.  Although we don't mind issues being opened, unless the issue is clearly actionable and falls in-line with the motivations and trajectory of the project, we would request opening a [Discussion](https://github.com/ProjectEvergreen/greenwood/discussions) first.

We encourage discussions as we believe it is better to hash out technical discussions and proposals ahead of time since writing and reviewing code are very time consuming activities, on both sides.  As maintainers, we want to make sure everyone gets the time they deserve for contributing, and this workflow helps us plan our time and roadmap in advance to best ensure a smooth flow of contributions through the project.

### Issues

We like to reserve issues for features and requests that are more or less "shovel" ready with clear implementation details at hand and a clear definition of "done".  This could include prior discussions with the team or action items coming out of an existing discussion.

Our standard issue template requests the following information to be provided:
1. High Level Overview
1. Code Sample or API Design
1. Links / references for more context

> 👉 _Bugs require clear reproductions with steps, ideally provided as a GitHub repo._

### Pull Requests

Pull requests are the best!  To best help facilitate contributions to the project, we have [**Conventional Commits**](https://www.conventionalcommits.org/) configured for the project to walk you through preparing commits in the format of `<type>(<scope>): #<issue> <summary of change>`, e.g. _bug(cli): #123 fixed bug with the thing_.

Make sure you have run `yarn lint`, `yarn format` and `yarn test` to prepare your commit.

Then, after staging your files with `git add`, you can initiate the commit "wizard" by running:

```sh
$ yarn commit
```

The following will be required:
- **type**
- **scope**
- **issue reference** (can technically be empty)

> ⚠️ _**Note**: The breaking change prompt / option is broken in commitlint; [[1](https://github.com/conventional-changelog/commitlint/issues/4191)], [[2](https://github.com/conventional-changelog/commitlint/issues/4100)].  Please call out breaking changes in your PR._

## Testing

Greenwood relies on a large set of test suites that are very behavior / outcome based, in that we prefer to scaffold out a full Greenwood project, including a full configuration file and mock _src/_ directory.  Combined with mocha for testing and [**gallinago**](https://github.com/thescientist13/gallinago) as the CLI runner, we find it to be very intuitive to run Greenwood under test with any combination of configuration or project structure.

### Running Tests

To run tests in watch mode, use:

```shell
$ yarn test:tdd
```

To verify compliance with coverage and watermark thresholds (what CI checks against), use:

```shell
$ yarn test
$ yarn test:loaders
```

Below are some tips to help with running / debugging tests:
- `describe.only` / `it.only`: only runs this block
- `xdescribe` / `xit`: don't run this block
- Uncomment `await runner.teardown()` in a case to see the build output without it getting cleaned up post test run
- Use `new Runner(true)` to get debug output from Greenwood when running tests

> 🛑 _**PLEASE DO NOT COMMIT ANY OF THE ABOVE CHANGES THOUGH**_

### Writing Tests

Test cases follow a convention starting with the command (e.g. `build`) and the capability and features being tested, like configuration with a particular option (e.g. `port`):

```shell
<command>.<capability>.<feature>-<modifier>.spec.js
```

Examples:
- _build.default.spec.js_ - Would test `greenwood build` with no config and no workspace.
- _build.config.workspace-custom.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace`
- _build.config.workspace-dev-server-port.spec.js_ - Would test `greenwood build` with a config that had a custom `workspace` and `devServer.port` set.

Below is an example test case:

```js
import { expect } from 'chai';
import { JSDOM } from 'jsdom';
import path from 'node:path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'node:url';

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

### Custom Loaders

Test cases that exercise custom loaders for SSR and pre-rendering use cases will need to do a couple of things:

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
1. Run `yarn test:loaders`

### Code Content Testing

In some cases tests may actually check for specific build output contents to confirm certain operations like custom bundling or linking operations within the Greenwood build process worked as expected.  Keep in mind that if you change these contents as part of a test, and then Prettier formatting is run, the results may change and the test cases may fail, so just make sure to double check these contents with formatting applied first.

## Dependency Management

To add and remove packages for any workspace, make sure you `cd` into the directory with the _package.json_ first, before running `yarn add` or `yarn remove`.

For example:

```shell
$ cd packages/cli
$ yarn add <package>
```

> 🗒️ _For adding packages to the workspace (top level `package.json`) you will need to run the `yarn` command from the root and pass the `-W` flag_

## Types

Greenwood [provides types](https://greenwoodjs.dev/docs/reference/) for a number of its key primitives (configuration, plugins, content as data) as well as its plugins.  It is important to update these as features are developed and iterated upon.

Additionally, Greenwood leverages [exports maps](https://nodejs.org/api/packages.html#exports) as part of its distribution through NPM, which means (generally) every plugin should only have `main` and `exports` defined:

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

The Greenwood repo is a workspaces based monorepo.  The root level _package.json_ defines the workspaces and shared tooling used throughout the project, like for linting, testing, etc.  The main workspace is the [_packages/_](https://github.com/ProjectEvergreen/greenwood/tree/master/packages) directory, which contains the code for the packages we publish to NPM under the **@greenwood** scope.

> 🗒️ _This guide is mainly intended to walk through the **cli** package; it being the principal package within the project supporting all other packages. See our website for documentation on our [Plugin APIs](https://www.greenwoodjs.dev/docs/reference/plugins-api/)._

### CLI

The CLI is the way users interact with Greenwood, similar to how the [front-controller pattern](https://en.wikipedia.org/wiki/Front_controller) works.  When users run a command like `greenwood build`, they are effectively invoking the file _src/bin.js_ within the `@greenwood/cli` package.

At a high level, this is how a command goes through the CLI:
1. Each documented command a user can run maps to a script in the _commands/_ directory.
1. Each command can invoke any number of lifecycles from the _lifecycles/_ directory.
1. Lifecycles capture specific steps needed to build a site, serve it, generate a content dependency graph, etc.

**Package Structure**

The [structure](https://github.com/ProjectEvergreen/greenwood/tree/master/packages/cli/src) of the CLI package is as follows:

- _bin.js_ - Entry point for the CLI, as defined in the `bin` field of the CLI's _package.json_
- _index.js_ - Standalone function export used to call the CLI with a command
- _commands/_ - Scripts that map to commands exposed by the `greenwood` CLI; `develop`, `build`, `serve`
- _config/_ - Tooling configuration
- _data/_ - Content as data related functionality
- _lib/_ - Shared utilities used by the CLI
- _lifecycles/_ - Scripts that support the various commands exposed by the CLI; starting the dev server, bundling client and server side scripts, prerendering, etc
- _plugins/_ - Greenwood plugins maintained as core by the CLI itself

## Release Management

Lerna (specifically `lerna publish`) will be used to release all packages under a single version bump.  Lerna configuration can be found in _lerna.json_ at the root of the repo.  All packages are managed using [Yarn (1.x) workspaces](https://classic.yarnpkg.com/lang/en/docs/workspaces/).

Assuming you are logged into **npm** locally and have 2FA access to publish, the following workflows should be used.  Lerna should then prompt you through the steps to pick the version and all packages that will get updated.

### Dry Run

To test Lerna's publishing output to see what changes it would make, you can run Lerna in "dry run" mode using the following command:

> 🚨 _Make sure to cancel (Ctrl+C) in the terminal when prompted with the OTP prompt for npm publishing._

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

> 🗒️ _Typically you will want to select the **Custom Preminor** option from the list, which Lerna should then appropriately yield  tp the expected version.  But do double check and make sure the version bump is correct!_

### Standard Release

For a formal release, e.g. **latest**, run the following command:
```sh
# from the root of the repo
$ yarn lerna publish --force-publish
```

