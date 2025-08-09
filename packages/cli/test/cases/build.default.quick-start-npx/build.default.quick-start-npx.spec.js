/*
 * Use Case
 * Run Greenwood build command with no config and emulating being run with npx
 *
 * User Result
 * Should generate a bare bones Greenwood build with no errors for missing files
 * by specifically not scaffolding node_modules/ needed for es-modules-shims and webcomponents-bundle.
 * https://github.com/ProjectEvergreen/greenwood/issues/505
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.md
 *   layouts/
 *     page.html
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace and emulating npx";
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

    describe("Default output for index.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      describe("head section tags", function () {
        it("should have a <title> tag in the <head>", function () {
          const title = dom.window.document.querySelector("head title").textContent;

          expect(title).to.be.equal("My App");
        });

        it("should have two <script> tag in the <head>", function () {
          const scripts = dom.window.document.querySelectorAll("head script[type='module']");

          expect(scripts.length).to.be.equal(1);
        });
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
