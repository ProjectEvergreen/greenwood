/*
 * Use Case
 * Run Greenwood serve command without having already run greenwood build.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * N / A
 *
 * User Workspace
 * Greenwood default
 */
import { expect } from "chai";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Serve Greenwood With: ", function () {
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe("Running the serve command without running the build command first", function () {
    it("should throw an error that no build output was detected", async function () {
      await runner.setup(outputUrl);
      await expect(runner.runCommand(cliUrl, { args: "serve" })).to.be.rejectedWith(
        "Error: No build output detected. Make sure you have run greenwood build",
      );
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
