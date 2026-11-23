/*
 * Use Case
 * Run Greenwood with Babel processing.
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's JavaScript files processed based on the default plugin babel.config.js.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginBabel } from '@greenwood/plugin-babel';
 *
 * {
 *   plugins: [
 *     greenwoodPluginBabel()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 *
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Babel configuration";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Babel should process JavaScript that reference private class members / methods", function () {
      it("should output correctly processed JavaScript without private members", function () {
        const expectedJavaScript = "#x";
        const jsFiles = glob.sync(fileURLToPath(new URL("*.js", this.context.publicDir)));
        const javascript = fs.readFileSync(jsFiles[0], "utf-8");

        expect(jsFiles.length).to.equal(1);
        expect(javascript).to.not.contain(expectedJavaScript);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
