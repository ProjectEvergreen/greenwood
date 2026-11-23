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
 * import { greenwoodPluginImportCss } from '@greenwood/plugin-import-css';
 *
 * {
 *   plugins: [{
 *      ...greenwoodPluginImportCss()
 *  }]
 * }
 *
 * User Workspace
 * src/
 *   main.js
 *   styles.css
 *   pages/
 *     index.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

xdescribe("Build Greenwood With: ", function () {
  const LABEL = "Import CSS Plugin with default options";
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

    describe("importing CSS using ESM (import)", function () {
      let scripts;

      before(async function () {
        scripts = await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir)));
      });

      it("should contain one (CSS-in) JavaScript file in the output directory", function () {
        expect(scripts.length).to.be.equal(1);
      });

      it("should have the expected output from importing styles.css in main.js", function () {
        const contents = fs.readFileSync(scripts[0], "utf-8");

        // TODO minify CSS-in-JS?
        expect(contents).to.contain('import from styles.css: p {   color: red; }"');
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
