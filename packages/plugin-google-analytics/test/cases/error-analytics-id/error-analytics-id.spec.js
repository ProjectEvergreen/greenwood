/*
 * Use Case
 * Run Greenwood with Google Analytics composite plugin.
 *
 * User Result
 * Should generate an error when not passing in a valid analyticsId.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginGoogleAnalytics } from '@greenwood/plugin-google-analytics';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginGoogleAnalytics()
 *  }]
 *
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
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe("Google Analytics Plugin with a bad value for analyticsId", function () {
    it("should throw an error that analyticsId must be a string", async function () {
      await runner.setup(outputUrl);

      await expect(runner.runCommand(cliUrl, { args: "build" })).to.be.rejectedWith(
        `Error: analyticsId should be of type string.  got "undefined" instead.`,
      );
    });
  });

  after(async function () {
    await runner.teardown();
  });
});
