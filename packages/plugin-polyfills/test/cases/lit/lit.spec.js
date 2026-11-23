/*
 * Use Case
 * Run Greenwood with Polyfills composite plugin with default options and using Lit.
 *
 * User Result
 * Should generate a bare bones Greenwood build with polyfills injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';
 *
 * {
 *   plugins: [
 *     greenwoodPluginPolyfills({
 *       lit: true
 *     })
 *   ]
 * }
 *
 * User Workspace
 * src/
 *   index.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Lit Polyfill Plugin with default options and Default Workspace";
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

    describe("Script tag in the <head> tag", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have one <script> tag for lit polyfills loaded in the <head> tag", function () {
        const scriptTags = dom.window.document.querySelectorAll("head > script");
        const polyfillScriptTags = Array.prototype.slice.call(scriptTags).filter((script) => {
          return script.src.indexOf("polyfill-support") >= 0;
        });

        expect(polyfillScriptTags.length).to.be.equal(1);
      });

      it("should have the expected lit polyfill files in the output directory", function () {
        const expectedLitPolyfillFiles = ["polyfill-support.js"];

        expectedLitPolyfillFiles.forEach((file) => {
          expect(fs.existsSync(new URL(file, this.context.publicDir))).to.be.equal(true);
        });
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
