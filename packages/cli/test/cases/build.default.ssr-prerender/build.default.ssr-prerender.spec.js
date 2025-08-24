/*
 * Use Case
 * Run Greenwood with an SSR route that is prerender using configuration.
 *
 * User Result
 * Should generate a bare bones Greenwood build for hosting a prerender SSR application.
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
 *     footer.js
 *     header.js
 *     logo.js
 *     social-links.js
 *   pages/
 *     about.js
 *     index.js
 *   layouts/
 *     app.html
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

// contains test cases for these bugs
// https://github.com/ProjectEvergreen/greenwood/issues/1044
// https://github.com/ProjectEvergreen/greenwood/issues/988#issuecomment-1288168858
describe("Build Greenwood With: ", function () {
  const LABEL = "A Server Rendered Application (SSR) with prerender configuration";
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

    describe("Build command that prerenders the SSR home page with multiple custom elements", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
      });

      it("should have the expected SSR page content in the HTML", function () {
        const headings = dom.window.document.querySelectorAll("body h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("This is the home page.");
      });

      it("should have one top level <app-header> tag with an open shadowroot", function () {
        const header = dom.window.document.querySelectorAll(
          'app-header template[shadowrootmode="open"]',
        );
        const headerContentsDom = new JSDOM(header[0].innerHTML);
        const heading = headerContentsDom.window.document.querySelectorAll("h1");

        expect(header.length).to.equal(1);
        expect(heading.length).to.equal(1);
        expect(heading[0].textContent.trim()).to.equal("This is the header component.");
      });

      it("should have the expected number of items pre-rendered for the two <app-social-links> tags", function () {
        // one set comes from the HTML, one from the SSR page
        const links = dom.window.document.querySelectorAll("body > app-social-links ul li a");

        expect(links.length).to.equal(6);
      });

      it("should have one top level <app-footer> tag with expected link items", function () {
        const footer = dom.window.document.querySelectorAll("app-footer");
        const paragraph = footer[0].querySelectorAll("p");
        const links = footer[0].querySelectorAll("app-social-links ul li a");

        expect(footer.length).to.equal(1);
        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent.trim()).to.equal("This is the footer component.");
        expect(links.length).to.equal(3);
      });
    });

    describe("Build command that prerenders the SSR about pages with shared custom elements", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./about/index.html"));
      });

      it("should have the expected SSR page content in the HTML", function () {
        const headings = dom.window.document.querySelectorAll("body h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("Welcome to Greenwood!");
      });

      it("should have one top level <app-header> tag with an open shadowroot", function () {
        const header = dom.window.document.querySelectorAll(
          'app-header template[shadowrootmode="open"]',
        );
        const headerContentsDom = new JSDOM(header[0].innerHTML);
        const heading = headerContentsDom.window.document.querySelectorAll("h1");

        expect(header.length).to.equal(1);
        expect(heading.length).to.equal(1);
        expect(heading[0].textContent.trim()).to.equal("This is the header component.");
      });

      // specifically to test for these bugs
      // https://github.com/ProjectEvergreen/greenwood/issues/1044
      // https://github.com/ProjectEvergreen/greenwood/issues/988#issuecomment-1288168858
      it("should have the expected number of top level items pre-rendered for the <app-social-links> tag in the body", function () {
        // one set comes from the HTML, one from the SSR page
        const links = dom.window.document.querySelectorAll("body > app-social-links ul li a");

        expect(links.length).to.equal(3);
      });

      it("should have one top level <app-footer> tag with expected <app-social-link> items", function () {
        const footer = dom.window.document.querySelectorAll("app-footer");
        const paragraph = footer[0].querySelectorAll("p");
        const links = footer[0].querySelectorAll("app-social-links ul li a");

        expect(footer.length).to.equal(1);
        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent.trim()).to.equal("This is the footer component.");
        expect(links.length).to.equal(3);
      });

      it("should have one top level <app-logo> tag and expected content", function () {
        const logo = dom.window.document.querySelectorAll(
          'app-logo template[shadowrootmode="open"]',
        );
        const logoContentsDom = new JSDOM(logo[0].innerHTML);
        const paragraph = logoContentsDom.window.document.querySelectorAll("p");

        expect(logo.length).to.equal(1);
        expect(paragraph.length).to.equal(1);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
