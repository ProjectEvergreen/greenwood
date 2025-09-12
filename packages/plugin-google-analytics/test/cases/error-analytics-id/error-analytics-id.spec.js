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
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

chai.use(chaiAsPromised);

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe("Google Analytics Plugin with a bad value for analyticsId", function () {
    it("should throw an error that analyticsId must be a string", async function () {
      await runner.setup(outputPath);

      await expect(runner.runCommand(cliPath, "build")).to.be.rejectedWith(
        `Error: analyticsId should be of type string.  got "undefined" instead.`,
      );
    });
  });

  after(function () {
    runner.teardown();
  });
});
