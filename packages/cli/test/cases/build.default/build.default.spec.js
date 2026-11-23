/*
 * Use Case
 * Run Greenwood build command with no config.
 *
 * User Result
 * Should generate a bare bones Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * Empty
 */
import { expect } from "chai";
import glob from "glob-promise";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default (Empty) Greenwood Configuration and Workspace";
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
      it("should contain no HTML files in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("*.html", this.context.publicDir))),
        ).to.have.lengthOf(0);
      });

      it("should contain no JS files in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir))),
        ).to.have.lengthOf(0);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
