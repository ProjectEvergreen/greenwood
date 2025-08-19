/*
 * Use Case
 * Run Greenwood build command with prerender config set to true.
 *
 * User Result
 * Should generate a Greenwood build with the expected generated output using custom elements.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Prerender Configuration turned on";
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
      });

      it("should have prerendered content from <app-header> component", function () {
        const appHeader = dom.window.document.querySelectorAll(
          'body app-header template[shadowrootmode="open"]',
        );

        expect(appHeader.length).to.equal(1);
        expect(appHeader[0].innerHTML.trim()).to.equal(
          "<header>This is the header component.</header>",
        );
      });
    });
  });

  after(async function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
