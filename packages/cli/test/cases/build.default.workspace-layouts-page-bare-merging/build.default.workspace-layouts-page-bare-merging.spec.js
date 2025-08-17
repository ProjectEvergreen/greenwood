/*
 * Use Case
 * Run Greenwood build command with no config and emplty page layouts.
 *
 * User Result
 * Should generate a bare bones Greenwood build.
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
 *     index.html
 *   layouts/
 *     page.html
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
  const LABEL = "Default Greenwood Configuration w/ Bare Page Merging";
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
        let metaTags;

        before(function () {
          metaTags = dom.window.document.querySelectorAll("head > meta");
        });

        it("should have not have a <title> tag in the <head>", function () {
          const title = dom.window.document.querySelector("head title").textContent;

          expect(title).to.be.equal("");
        });

        it("should not have any default <meta> tags in the <head>", function () {
          expect(metaTags.length).to.be.equal(0);
        });
      });

      describe("expected content output in <body> tag", function () {
        it("should have expected h2 tag in the <body>", function () {
          const h1 = dom.window.document.querySelectorAll("body h1");

          expect(h1.length).to.be.equal(1);
          expect(h1[0].textContent).to.be.equal("Page Layout Heading");
        });

        it("should have expected h2 tag in the <body>", function () {
          const h2 = dom.window.document.querySelectorAll("body h2");

          expect(h2.length).to.be.equal(1);
          expect(h2[0].textContent).to.be.equal("Quick Start");
        });

        it("should have expected content output tag in the <body>", function () {
          const p = dom.window.document.querySelectorAll("body p");

          expect(p.length).to.be.equal(1);
          expect(p[0].textContent).to.be.equal("This is a test.");
        });
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
