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
import chai from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Babel configuration";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Babel should process JavaScript that reference private class members / methods", function () {
      it("should output correctly processed JavaScript without private members", function () {
        const expectedJavaScript = "#x";
        const jsFiles = glob.sync(path.join(this.context.publicDir, "*.js"));
        const javascript = fs.readFileSync(jsFiles[0], "utf-8");

        expect(jsFiles.length).to.equal(1);
        expect(javascript).to.not.contain(expectedJavaScript);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
