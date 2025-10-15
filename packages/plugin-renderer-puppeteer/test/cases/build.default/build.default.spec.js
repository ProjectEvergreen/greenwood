/*
 * Use Case
 * Run Greenwood build command when using the puppeteer renderer plugin for prerendering.
 *
 * User Result
 * Should generate a Greenwood build with puppeteer generated output for Web Components.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [
 *     ...greenwoodPluginRendererPuppeteer()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
import chai from "chai";
import fs from "node:fs/promises";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Puppeteer prerendering enabled";
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
    before(async function () {
      await runner.setup(outputPath);

      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Default output for index.html", function () {
      let dom;
      let raw;

      before(async function () {
        const outputFile = path.join(this.context.publicDir, "./index.html");

        raw = await fs.readFile(outputFile, "utf-8");
        dom = await JSDOM.fromFile(outputFile);
      });

      describe("head section tags", function () {
        it("should have a <title> tag in the <head>", function () {
          const title = dom.window.document.querySelector("head title").textContent;

          expect(title).to.be.equal("My App");
        });

        it("should have one <style> tag in the <head> from puppeteer", function () {
          const styleTag = dom.window.document.querySelectorAll("head style");

          expect(raw).to.contain("<!-- Shady DOM styles for app-header -->");
          expect(styleTag.length).to.be.equal(1);
          expect(styleTag[0].textContent).to.contain("body[unresolved]");
        });
      });

      it("should contain the expected number of javascript files in the output directory", async function () {
        expect(await glob.promise(path.join(this.context.publicDir, "*.js"))).to.have.lengthOf(3);
      });

      it("should have the expected output from main.js for lit (ESM) in the page output", async function () {
        const litOutput = dom.window.document.querySelectorAll("body > .output-lit");

        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal("import from lit W29iamVjdCBIVE1M");
      });

      it("should have the expected output from main.js for lodash-es (ESM) in the page output", async function () {
        const litOutput = dom.window.document.querySelectorAll("body > .output-lodash");

        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal('import from lodash-es {"a":1,"b":2}');
      });

      it("should have the expected output from main.js for pwa-helpers (ESM) in the page output", async function () {
        const litOutput = dom.window.document.querySelectorAll("body > .output-pwa");

        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal("import from pwa-helpers KGNvbWJpbmVSZWR1");
      });

      it("should have the expected output from main.js for Redux (MJS) in the page output", async function () {
        const reduxOutput = dom.window.document.querySelectorAll("body > .output-redux");

        expect(reduxOutput.length).to.be.equal(1);
        expect(reduxOutput[0].textContent).to.be.equal("import from redux ZnVuY3Rpb24gY3Jl");
      });

      it("should have the expected output from the first inline <script> tag in the page output", async function () {
        const inlineScriptOutput = dom.window.document.querySelectorAll(
          "body > .output-script-inline",
        );

        expect(inlineScriptOutput.length).to.be.equal(1);
        expect(inlineScriptOutput[0].textContent).to.be.equal("script tag module inline");
      });

      it("should have the expected output from main.js for try / catch error of no error text", async function () {
        const errorOutput = dom.window.document.querySelectorAll("body > .output-error");

        expect(errorOutput.length).to.be.equal(1);
        expect(errorOutput[0].textContent).to.be.equal("");
      });

      it("should have the expected inline node_modules content in the first inline script tag which should include extra code from rollup", async function () {
        const inlineScriptTag = Array.from(
          dom.window.document.querySelectorAll("head > script:not([src])"),
        ).filter((tag) => !tag.getAttribute("data-gwd"))[0];

        expect(inlineScriptTag.textContent.replace("\n", "")).to.contain(
          'import"/lit-element.5o_Y6C1Q.js";document.getElementsByClassName("output-script-inline")[0].innerHTML="script tag module inline";//# sourceMappingURL=1644043439.CKFVi45M.js.map',
        );
      });

      it("should have prerendered content from <app-header> component", function () {
        const appHeader = dom.window.document.querySelectorAll("body app-header");
        const header = dom.window.document.querySelectorAll("body header");

        expect(appHeader.length).to.equal(1);
        expect(header.length).to.equal(1);
        expect(header[0].textContent.trim()).to.equal("This is the header component.");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
