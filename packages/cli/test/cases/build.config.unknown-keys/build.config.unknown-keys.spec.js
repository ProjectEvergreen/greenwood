/*
 * Use Case
 * Run Greenwood build command with unsupported top level options in a custom config.
 *
 * User Result
 * Should complete the build and warn about each unsupported option.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   basepath: "/my-app",
 *   notARealOption: 42,
 *   staticRouter: false
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Configuration with unsupported options";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;
  let stderr = "";

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      const build = runner.runCommand(cliPath, "build");

      // the runner only surfaces stderr for a non zero exit code, and this build is expected to pass
      runner.childProcess.stderr.on("data", function (data) {
        stderr += data.toString();
      });

      await build;
    });

    runSmokeTest(["public", "index"], LABEL);

    it("should warn about a misspelling of a supported option", function () {
      expect(stderr).to.contain(
        'Configuration warning: "basepath" is not a supported configuration option and will be ignored.',
      );
    });

    it("should warn about an option Greenwood does not know about at all", function () {
      expect(stderr).to.contain(
        'Configuration warning: "notARealOption" is not a supported configuration option and will be ignored.',
      );
    });

    it("should not warn about a supported option that has no default value", function () {
      expect(stderr).to.not.contain('Configuration warning: "staticRouter"');
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
