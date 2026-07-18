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
import { expect } from "chai";
import glob from "glob-promise";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

// https://github.com/ProjectEvergreen/greenwood/issues/1707
describe("Build Greenwood With: ", function () {
  const LABEL = "Default Config and Unsupported File Extension in the API Directory";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"]);

    describe("Default output", function () {
      it("should emit the index page in the output directory", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "index.html")),
        ).to.have.lengthOf(1);
      });

      it("should emit the one valid API route in the output directory", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "api/**/*.js")),
        ).to.have.lengthOf(1);
      });

      it("should not emit the unsupported api file in the output directory", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "api/**/*.txt")),
        ).to.have.lengthOf(0);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
