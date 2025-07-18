/*
 * Use Case
 * Run Greenwood with pluginImportCommonjs plugin with default options.
 * Sets prerender: true to validate the functionality.
 *
 * User Result
 * Should generate a bare bones Greenwood build without erroring on a CommonJS module.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportCommonJs } from '@greenwood/plugin-import-commonjs';
 *
 * {
 *   plugins: [{
 *     ...greenwoodPluginImportCommonJs()
 *  }]
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
import chai from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Import CommonJs Plugin with default options";
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

    describe("Script tag in the <head> tag", function () {
      let dom;
      let scripts;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
        scripts = await glob.promise(path.join(this.context.publicDir, "main.*.js"));
      });

      it("should have one <script> tag for main.js loaded in the <head> tag", function () {
        const scriptTags = dom.window.document.querySelectorAll("head > script");
        const mainScriptTag = Array.prototype.slice.call(scriptTags).filter((script) => {
          return /main.*.js/.test(script.src);
        });

        expect(mainScriptTag.length).to.be.equal(1);
      });

      it("should have the expected main.js file in the output directory", async function () {
        expect(scripts.length).to.be.equal(1);
      });

      it("should have the expected CommonJS contents from main.js (lodash) in the output", async function () {
        const contents = fs.readFileSync(scripts[0], "utf-8");

        expect(contents).to.contain(
          'document.getElementsByTagName("span")[0].innerHTML=`import from lodash ${a}`',
        );
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
