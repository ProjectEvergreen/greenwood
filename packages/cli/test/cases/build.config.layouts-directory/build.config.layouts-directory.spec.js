/*
 * Use Case
 * Run Greenwood with a custom name for layouts directory.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom title in header
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   layoutsDirectory: 'layouts'
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     index.html
 *   layouts/
 *     page.html
 */
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { expect } from "chai";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Layouts Directory from Configuration";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
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

    describe("Page Content", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should output an index.html file for the home page", function () {
        expect(fs.existsSync(new URL("index.html", this.context.publicDir))).to.be.true;
      });

      it("should have the correct page heading", function () {
        const heading = dom.window.document.querySelectorAll("head title")[0].textContent;

        expect(heading).to.be.equal("Custom Layout Page Layout");
      });

      it("should have the correct page heading", function () {
        const heading = dom.window.document.querySelectorAll("body h1")[0].textContent;

        expect(heading).to.be.equal("Home Page");
      });

      it("should have the correct page heading", function () {
        const paragraph = dom.window.document.querySelectorAll("body p")[0].textContent;

        expect(paragraph).to.be.equal("A page using a page layout from a custom layout directory.");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
