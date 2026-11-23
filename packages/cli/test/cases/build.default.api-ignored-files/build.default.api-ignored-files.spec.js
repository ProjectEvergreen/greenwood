/*
 * Use Case
 * Run Greenwood build command with no config and an unsupported (non-js/ts) file in the api directory.
 *
 * User Result
 * Should generate a bare bones Greenwood build, skipping the unsupported api file while still
 * emitting the valid API route and pages (instead of aborting the whole build).
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   pages/
 *     api/
 *       greeting.js
 *       notes.txt
 *     index.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import glob from "glob-promise";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

// https://github.com/ProjectEvergreen/greenwood/issues/1707
describe("Build Greenwood With: ", function () {
  const LABEL = "Default Config and Unsupported File Extension in the API Directory";
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

    runSmokeTest(["public"]);

    describe("Default output", function () {
      it("should emit the index page in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("index.html", this.context.publicDir))),
        ).to.have.lengthOf(1);
      });

      it("should emit the one valid API route in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("api/**/*.js", this.context.publicDir))),
        ).to.have.lengthOf(1);
      });

      it("should not emit the unsupported api file in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("api/**/*.txt", this.context.publicDir))),
        ).to.have.lengthOf(0);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
