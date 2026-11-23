/*
 * Use Case
 * Run Greenwood build command with a bad value for polyfill.importAttributes in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   polyfills: {
 *     importAttributes: {}
 *   }
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

  describe("Custom Configuration with a bad value for Polyfills w/ Import Attributes", function () {
    it("should throw an error that polyfills.importAttributes must be an array of types; ['css', 'json']", async function () {
      await runner.setup(outputUrl);

      await expect(runner.runCommand(cliUrl, { args: "build" })).to.be.rejectedWith(
        "Configuration error: polyfills.importAttributes must be an array of types; ['css', 'json'].  Passed value was typeof: object",
      );
    });
  });
});
