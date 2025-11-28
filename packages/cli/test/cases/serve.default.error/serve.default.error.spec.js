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
import chai from "chai";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Serve Greenwood With: ", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe("Running the serve command without running the build command first", function () {
    it("should throw an error that no build output was detected", async function () {
      await runner.setup(outputPath);
      await expect(runner.runCommand(cliPath, "serve")).to.be.rejectedWith(
        "No build output detected. Make sure you have run greenwood build",
      );
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
