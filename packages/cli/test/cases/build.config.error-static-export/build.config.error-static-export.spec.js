/*
 * Use Case
 * Run Greenwood build command with a bad value for staticExport in a custom config.
 *
 * User Result
 * Should throw an error.
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
    runner = new Runner();
  });

  describe("Custom Configuration with a bad value for staticExport", function () {
    it("should throw an error that staticExport must be a boolean", async function () {
      await runner.setup(outputUrl);

      await expect(runner.runCommand(cliUrl, { args: "build" })).to.be.rejectedWith(
        "Configuration error: staticExport must be a boolean; true or false.  Passed value was typeof: object",
      );
    });
  });
});
