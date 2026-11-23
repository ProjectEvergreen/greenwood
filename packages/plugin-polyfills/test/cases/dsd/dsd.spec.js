/*
 * Use Case
 * Run Greenwood with Polyfills composite plugin with Declarative Shadow DOM polyfill.
 *
 * User Result
 * Should generate a bare bones Greenwood build with DSD polyfill injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [
 *     greenwoodPluginPolyfills({
 *       dsd: true
 *     })
 *   ]
 * }
 *
 * User Workspace
 * src/
 *   index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Declarative Shadow DOM Polyfill Plugin with default options and Default Workspace";
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

    runSmokeTest(["public"], LABEL);

    describe("Script tag in the <head> tag", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have one <script> tag for DSD polyfill loaded in the <body> tag", function () {
        const scriptTags = Array.from(dom.window.document.querySelectorAll("head > script")).filter(
          (tag) => !tag.getAttribute("data-gwd"),
        );

        expect(scriptTags.length).to.be.equal(0);
      });

      it("should have one <script> tag for DSD polyfill loaded in the <body> tag", function () {
        const scriptTags = dom.window.document.querySelectorAll("body > script");

        expect(scriptTags.length).to.be.equal(1);
      });

      it("should have the expected DSD polyfill content in the polyfill <script> tag", function () {
        const scriptTags = dom.window.document.querySelectorAll("body > script");

        expect(scriptTags[0].textContent).to.contain(
          'HTMLTemplateElement.prototype.hasOwnProperty("shadowRoot")||function t(o){o.querySelectorAll("template[shadowroot]")',
        );
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
