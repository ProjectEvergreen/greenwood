/*
 * Use Case
 * Run Greenwood build command with custom workspace directory (absolute path) and custom pages.
 *
 * User Result
 * Should generate a Greenwood build from www directory with about and index pages.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   workspace: fileURLToPath(new URL('./www', import.meta.url))
 * }
 *
 * User Workspace
 * www/
 *   pages/
 *     about.html
 *     index.html
 */
import { expect } from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Configuration for Workspace (www) and Default Greenwood configuration";
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

    describe("Custom About page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("about/index.html", this.context.publicDir)),
        );
      });

      it("should output an index.html file within the custom about page directory", function () {
        expect(fs.existsSync(new URL("about/index.html", this.context.publicDir))).to.be.true;
      });

      it("should have the expected heading text within the custom about page in the about directory", function () {
        const heading = dom.window.document.querySelector("h3").textContent;

        expect(heading).to.equal("Custom About Page");
      });

      it("should have the expected paragraph text within the custom about page in the about directory", function () {
        let paragraph = dom.window.document.querySelector("p").textContent;

        expect(paragraph).to.equal("This is a custom about page built by Greenwood.");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
