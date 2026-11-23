/*
 * Use Case
 * Run Greenwood with Polyfills composite plugin with default options.
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
 *   plugins: [{
 *     greenwoodPluginPolyfills()
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   index.html
 */
import { expect } from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expectedPolyfillFiles = [
  "webcomponents-loader.js",
  "webcomponents-ce.js",
  "webcomponents-ce.js.map",
  "webcomponents-sd-ce-pf.js",
  "webcomponents-sd-ce-pf.js.map",
  "webcomponents-sd-ce.js",
  "webcomponents-sd-ce.js.map",
  "webcomponents-sd.js",
  "webcomponents-sd.js.map",
];

describe("Build Greenwood With: ", function () {
  const LABEL = "Polyfill Plugin with default options and Default Workspace";
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

      it("should have one <script> tag for polyfills loaded in the <head> tag", function () {
        const scriptTags = dom.window.document.querySelectorAll("head > script");
        const polyfillScriptTags = Array.prototype.slice.call(scriptTags).filter((script) => {
          // hyphen is used to make sure no other bundles get loaded by accident (#9)
          return script.src.indexOf("/webcomponents-") >= 0;
        });

        expect(polyfillScriptTags.length).to.be.equal(1);
      });

      it("should have the expected polyfill files in the output directory", function () {
        expectedPolyfillFiles.forEach((file) => {
          const dir = file === "webcomponents-loader.js" ? "" : "bundles/";

          expect(fs.existsSync(new URL(`${dir}${file}`, this.context.publicDir))).to.be.equal(true);
        });
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
