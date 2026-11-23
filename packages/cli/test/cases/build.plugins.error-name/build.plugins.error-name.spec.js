/*
 * Use Case
 * Run Greenwood build command with a bad value for the type of a plugin.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [{
 *     type: 'resource',
 *     plugin: function () { }
 *  }]
 * }
 *
 * User Workspace
 * N / A
 *
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

  describe("Custom Configuration with a bad name value for a plugin", function () {
    it("should throw an error that plugin.name is not a string", async function () {
      await runner.setup(outputUrl);

      await expect(runner.runCommand(cliUrl, { args: "build" })).to.be.rejectedWith(
        "Configuration error: plugins must have a name. got undefined instead.",
      );
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1745
    it("should surface the configuration error directly instead of an unhandled promise rejection", async function () {
      const error = await runner.runCommand(cliUrl, { args: "build" }).then(
        () => null,
        (err) => err,
      );

      expect(error.message).to.not.contain("UnhandledPromiseRejection");
    });
  });
});
