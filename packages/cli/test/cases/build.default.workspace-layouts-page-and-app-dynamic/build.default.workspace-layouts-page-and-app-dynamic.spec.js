/*
 * Use Case
 * Run Greenwood build command with no config and dynamic (e.g. .js) custom page (and app) layouts.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom page layout.
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
 *     about.html
 *     index.html
 *   layouts/
 *     app.js
 *     page.js
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL =
    "Default Greenwood Configuration and Workspace w/Custom Dynamic App and Page Layouts using JavaScript";
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

    runSmokeTest(["public"], LABEL);

    describe("Custom App and page with no <html> wrapping element", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have the expected <title> tag from the dynamic app layout", function () {
        const title = dom.window.document.querySelectorAll("head title");

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal("App Layout");
      });

      it("should have the expected <h1> tag from the dynamic app layout", function () {
        const heading = dom.window.document.querySelectorAll("h1");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal("App Layout");
      });

      it("should have the expected <h2> tag from the dynamic page layout", function () {
        const heading = dom.window.document.querySelectorAll("h2");

        expect(heading.length).to.equal(1);
      });

      it("should have the expected content from the index.md", function () {
        const heading = dom.window.document.querySelectorAll("h3");
        const paragraph = dom.window.document.querySelectorAll("p");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal("Home Page");

        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.equal("Coffey was here");
      });

      it("should have the expected <footer> tag from the dynamic app layout", function () {
        const year = new Date().getFullYear();
        const footer = dom.window.document.querySelectorAll("footer");

        expect(footer.length).to.equal(1);
        expect(footer[0].textContent).to.equal(`${year}`);
      });
    });

    describe("Custom App and Page Layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("about/index.html", this.context.publicDir)),
        );
      });

      it("should have the expected <title> tag from the dynamic app layout", function () {
        const title = dom.window.document.querySelectorAll("head title");

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal("App Layout");
      });

      it("should have the expected <h1> tag from the dynamic app layout", function () {
        const heading = dom.window.document.querySelectorAll("h1");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal("App Layout");
      });

      it("should have the expected <h2> tag from the dynamic page layout with layout constructor prop", function () {
        const heading = dom.window.document.querySelectorAll("h2");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal("Page Layout for /about/");
      });

      it("should have the expected <span> tag from the dynamic page layout with layout constructor prop", function () {
        const span = dom.window.document.querySelectorAll("span");

        expect(span.length).to.equal(1);
        expect(span[0].textContent).to.equal("Number of pages 2");
      });

      it("should have the expected content from the index.md", function () {
        const heading = dom.window.document.querySelectorAll("h3");
        const paragraph = dom.window.document.querySelectorAll("p");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal("About Page");

        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.equal("Learn more about us");
      });

      it("should have the expected <footer> tag from the dynamic app layout", function () {
        const year = new Date().getFullYear();
        const footer = dom.window.document.querySelectorAll("footer");

        expect(footer.length).to.equal(1);
        expect(footer[0].textContent).to.equal(`${year}`);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
