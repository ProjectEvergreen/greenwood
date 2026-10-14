/*
 * Use Case
 * Run Greenwood with RSS composite plugin.
 *
 * User Result
 * Should generate an error when not passing in the required channel options.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginRss } from '@greenwood/plugin-rss';
 *
 * {
 *   plugins: [greenwoodPluginRss()]
 * }
 *
 * User Workspace
 * N / A
 */
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

chai.use(chaiAsPromised);

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

  describe("RSS Plugin with missing required options", function () {
    it("should throw an error that title must be a string", async function () {
      await runner.setup(outputPath);

      await expect(runner.runCommand(cliPath, "build")).to.be.rejectedWith(
        `Error: title should be of type string.  got "undefined" instead.`,
      );
    });
  });

  after(async function () {
    await runner.teardown();
  });
});
