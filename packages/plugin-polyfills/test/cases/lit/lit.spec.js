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
 * Greenwood default
 */
import chai from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Lit Polyfill Plugin with default options and Default Workspace";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
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

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
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
          expect(fs.existsSync(path.join(this.context.publicDir, file))).to.be.equal(true);
        });
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
