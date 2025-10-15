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

  describe("Custom Configuration with a bad value for Polyfills w/ Import Attributes", function () {
    it("should throw an error that polyfills.importAttributes must be an array of types; ['css', 'json']", async function () {
      await runner.setup(outputPath);

      await expect(runner.runCommand(cliPath, "build")).to.be.rejectedWith(
        "Configuration error: polyfills.importAttributes must be an array of types; ['css', 'json'].  Passed value was typeof: object",
      );
    });
  });
});
