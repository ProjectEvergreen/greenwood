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
 * Greenwood default (src/)
 *
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

  describe("Custom Configuration with a bad name value for a plugin", function () {
    it("should throw an error that plugin.name is not a string", function () {
      try {
        runner.setup(outputPath);
        runner.runCommand(cliPath, "build");
      } catch (err) {
        expect(err).to.contain(
          "Error: greenwood.config.js plugins must have a name. got undefined instead.",
        );
      }
    });
  });
});
