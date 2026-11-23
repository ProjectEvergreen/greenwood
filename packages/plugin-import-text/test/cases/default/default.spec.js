/*
 * Use Case
 * Run Greenwood and be able to load arbitrary content as a string using ESM.
 *
 * User Result
 * Should generate a bare bones Greenwood build without erroring when using ESM (import) as a string value.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportText } from '@greenwood/plugin-import-text';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginImportText()
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   main.js
 *   styles.css
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Import Text Plugin with default options";
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

    describe("Importing a string of CSS using ESM (import)", function () {
      let scripts;

      before(async function () {
        scripts = await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir)));
      });

      it("should contain one (CSS-in) JavaScript file in the output directory", function () {
        expect(scripts.length).to.be.equal(1);
      });

      it("should have the expected output from importing styles.css in main.js", function () {
        const contents = fs.readFileSync(scripts[0], "utf-8");

        expect(contents).to.contain("import from styles.css: p{color:red}");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
