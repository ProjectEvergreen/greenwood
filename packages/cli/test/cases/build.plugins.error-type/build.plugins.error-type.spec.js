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
 *     type: 'indexxxx',
 *     name: 'plugin-something',
 *     provider: function() { }
 *  }]
 * }
 *
 * User Workspace
 * N / A
 *
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

  describe("Custom Configuration with a bad value for plugin type", function () {
    it("should throw an error that plugin.type is not a valid value", async function () {
      const pluginTypes = [
        "copy",
        "context",
        "resource",
        "rollup",
        "server",
        "source",
        "renderer",
        "adapter",
      ];

      await runner.setup(outputPath);

      await expect(runner.runCommand(cliPath, "build")).to.be.rejectedWith(
        `Configuration error: plugins must be one of type "${pluginTypes.join(", ")}". got "indexxx" instead.`,
      );
    });
  });
});
