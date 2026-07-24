/*
 * Use Case
 * Run Greenwood build command for a route with more than one dynamic segment (e.g. [a]/[b].js).
 *
 * User Result
 * Should fail fast at graph build time with a clear, actionable error instead of
 * emitting literal /[a]/ directories and then crashing with an unrelated TypeError.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 *  src/
 *   pages/
 *     [a]/
 *       [b].js
 */
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

chai.use(chaiAsPromised);

// https://github.com/ProjectEvergreen/greenwood/issues/1719
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

  describe("A route with more than one dynamic segment", function () {
    it("should throw a clear error that multiple dynamic route segments are not supported", async function () {
      await runner.setup(outputPath);

      await expect(runner.runCommand(cliPath, "build")).to.be.rejectedWith(
        "Multiple dynamic route segments are not currently supported",
      );
    });
  });
});
