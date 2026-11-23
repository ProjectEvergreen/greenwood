/*
 * Use Case
 * Run Greenwood with pluginImportCss plugin with default options.
 *
 * User Result
 * Should generate a bare bones Greenwood build without erroring when using ESM (import) with CSS.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';
 *
 * {
 *   plugins: [{
 *      ...greenwoodPluginImportJson()
 *  }]
 * }
 *
 * User Workspace
 * src/
 *   assets/
 *     data.json
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

xdescribe("Build Greenwood With: ", function () {
  const LABEL = "Import JSON Plugin with default options";
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
    before(function () {
      runner.setup(outputUrl);
      runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("importing JSON using ESM (import)", function () {
      let scripts;

      before(async function () {
        scripts = await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir)));
      });

      it("should contain one javascript file in the output directory", function () {
        expect(scripts.length).to.be.equal(1);
      });

      it("should have the expected output from importing data.json in main.js", function () {
        const contents = fs.readFileSync(scripts[0], "utf-8");

        expect(contents).to.contain(
          'const t=`${"got json"} via import, status is - ${200}`;document.getElementsByClassName("output-json-import")[0].innerHTML=t;',
        );
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
