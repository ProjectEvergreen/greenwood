/*
 * Use Case
 * Run Greenwood build command with no config and special characters in workspace files.
 *
 * User Result
 * Should successfully generate a Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   pages/
 *     First Post.html
 *     index.html
 *     Lügner2.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL =
    "Default Greenwood Configuration and Workspace with special characters in page names";
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

    describe("Default output for index.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have a the expected heading text", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("Home Page");
      });
    });

    describe("Default output for Lügner2.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("Lügner2/index.html", this.context.publicDir)),
        );
      });

      it("should have a the expected heading text", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("Lügner2 Page");
      });
    });

    describe("Default output for First Post.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("First Post/index.html", this.context.publicDir)),
        );
      });

      it("should have a the expected heading text", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("First Post Page");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
