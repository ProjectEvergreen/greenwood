/*
 * Use Case
 * Run Greenwood build command with a bad value for workspace directory in a custom config.
 *
 * User Result
 * Should throw an error.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   workspace: 123
 * }
 *
 * User Workspace
 * Greenwood default
 */
import chai from "chai";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

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

  describe("Custom Configuration with a bad value for Workspace", function () {
    it("should throw an error that workspace path must be a URL", function () {
      try {
        runner.setup(outputPath);
        runner.runCommand(cliPath, "build");
      } catch (err) {
        expect(err).to.contain("Error: greenwood.config.js workspace must be an instance of URL");
      }
    });
  });
});
