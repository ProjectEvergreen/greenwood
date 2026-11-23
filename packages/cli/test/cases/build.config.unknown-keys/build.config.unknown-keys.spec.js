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
 *   notARealOption: 42
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Configuration with unsupported options";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;
  let stderr = "";

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, {
        args: "build",
        onStdErr: (chunk) => {
          stderr += chunk;
        },
      });
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
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
