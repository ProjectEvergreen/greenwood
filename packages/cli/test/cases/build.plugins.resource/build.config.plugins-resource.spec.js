/*
 * Use Case
 * Run Greenwood with a custom resource plugin and default workspace.
 *
 * User Result
 * Should generate a bare bones Greenwood build with expected custom file (.foo) behavior.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * class FooResource {
 *   // see complete implementation in the greenwood.config.js file used for this spec
 * }
 *
 * {
 *   plugins: [{
 *     type: 'resource',
 *     name: 'plugin-foo',
 *     provider: (compilation, options) => new FooResource(compilation, options)
 *   }]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     index.html
 *   foo-files/
 *     my-custom-file.foo
 *     my-other-custom-file.foo
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom FooResource Plugin and Default Workspace";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    describe("Transpiling and DOM Manipulation", function () {
      let files;

      before(async function () {
        files = await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir)));
      });

      it("should have the expected JavaScript equivalent file in the output directory", function () {
        expect(files).to.have.lengthOf(1);
      });

      it("should have expected text from from my-other-custom-file.foo in the script output file", function () {
        const contents = fs.readFileSync(files[0], "utf-8");

        expect(contents).to.contain("hello from some-other-custom-file.foo!");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
