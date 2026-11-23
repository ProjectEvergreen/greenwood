/*
 * Use Case
 * Run Greenwood build command with static setting for optimization.
 *
 * User Result
 * Should generate a Greenwood build that strips all <script> tags and files from the final HTML and output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'static'
 * }
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Static Optimization Configuration";
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

    describe("JavaScript <script> tag and file static optimization", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should emit no javascript files to the output directory", async function () {
        const jsFiles = await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir)));

        expect(jsFiles).to.have.lengthOf(0);
      });

      it("should contain no <link> tags in the <head>", function () {
        const linkTags = dom.window.document.querySelectorAll("head link");

        expect(linkTags.length).to.be.equal(0);
      });

      it("should have no <script> tags in the <head>", function () {
        const scriptTags = dom.window.document.querySelectorAll('head script[type="module"]');

        expect(scriptTags.length).to.be.equal(0);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
