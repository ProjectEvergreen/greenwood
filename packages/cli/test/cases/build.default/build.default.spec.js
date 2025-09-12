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
import chai from "chai";
import glob from "glob-promise";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Default (Empty) Greenwood Configuration and Workspace";
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
      runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"]);

    describe("Default output should emit no HTML files", function () {
      it("should contain one javascript file in the output directory", async function () {
        expect(await glob.promise(path.join(this.context.publicDir, "*.html"))).to.have.lengthOf(0);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
