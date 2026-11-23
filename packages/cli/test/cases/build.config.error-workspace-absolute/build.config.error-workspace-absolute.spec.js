/*
 * Use Case
 * Run Greenwood build command with a bad value for workspace directory (that doesn't exist) in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   workspace: fileURLToPath(new URL('./noop', import.meta.url))
 * }
 *
 * User Workspace
 * N / A
 */
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { Runner } from "gallinago";

chai.use(chaiAsPromised);

describe("Build Greenwood With: ", function () {
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe("Custom Configuration with a bad value (absolute path) for Workspace", function () {
    it("should throw an error that workspace path must exist", async function () {
      await runner.setup(outputUrl);

      await expect(runner.runCommand(cliUrl, { args: "build" })).to.be.rejectedWith(
        "Configuration error: Workspace doesn't exist! Please double check your configuration.",
      );
    });
  });
});
