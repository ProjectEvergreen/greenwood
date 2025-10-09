/*
 * Use Case
 * Run Greenwood build command with no config and custom app layout.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom app layout.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   layouts/
 *     app.html
 *   pages/
 *     about.js
 *     index.html
 */
import chai from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace w/Custom App Layout";
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
    let dom;

    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Custom App Layout for index.html", function () {
      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
      });

      it("should output a single index.html file using our custom app layout", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "./index.html"))).to.be.true;
      });

      it("should have the <title> tag element we added as part of our custom app layout", function () {
        const appTitle = dom.window.document.querySelector("head title").textContent;

        expect(appTitle).to.equal("My App");
      });

      it("should have the <p> tag element we added as part of our custom app layout", function () {
        const appParagraph = dom.window.document.querySelector("body p").textContent;

        expect(appParagraph).to.equal("My Custom App Layout");
      });

      it("should have the <h1> tag element we added as part of our index.html page", function () {
        const pageHeading = dom.window.document.querySelector("body h1").textContent;

        expect(pageHeading).to.equal("Welcome to Greenwood!");
      });
    });

    describe("Custom App Layout for prerendered about.js page", function () {
      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "about/index.html"));
      });

      it("should output a single index.html file using our page", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "./about/index.html"))).to.be.true;
      });

      it("should have the <title> tag element we added as part of our page", function () {
        const pageTitle = dom.window.document.querySelector("head title").textContent;

        expect(pageTitle).to.equal("About Page");
      });

      it("should not have a <title> tag element we added as part of our page merged into the <body>", function () {
        const pageTitle = dom.window.document.querySelectorAll("title");

        expect(pageTitle.length).to.equal(1);
      });

      it("should have the <p> tag element we added as part of our custom app layout", function () {
        const appParagraph = dom.window.document.querySelector("body p").textContent;

        expect(appParagraph).to.equal("My Custom App Layout");
      });

      it("should have the <h1> tag element we added as part of our index.html page", function () {
        const pageHeading = dom.window.document.querySelector("body h1").textContent;

        expect(pageHeading).to.equal("About Page");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
