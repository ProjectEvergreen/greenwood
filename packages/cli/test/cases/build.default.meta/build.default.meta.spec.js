/*
 * Use Case
 * Run Greenwood and tests for correct `<meta>` tag merging for pages and layouts.
 *
 * User Result
 * Should generate a bare bones Greenwood build with one nested About page with expected meta values.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * Greenwood default w/ nested page
 *  src/
 *   favicon.svg
 *   pages/
 *     about/
 *       index.html
 *     hello.html
 *     index.html
 *   layout/
 *     app.html
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
  const LABEL = "Custom Meta Tags and Nested Workspace";
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

    describe("Index (home) page with custom meta data", function () {
      let dom;
      let graph;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
        graph = JSON.parse(
          await fs.promises.readFile(new URL("graph.json", this.context.publicDir), "utf-8"),
        );
      });

      it("should have the correct custom label from frontmatter for an index page in the graph", function () {
        const home = graph.filter((page) => page.route === "/");

        expect(home.length).to.be.equal(1);
        expect(home[0].label).to.be.equal("Home");
      });

      it("should have a <title> tag in the <head>", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("My Custom Greenwood App");
      });

      it("should have the expected heading text within the index page in the public directory", function () {
        const indexPageHeading = "Greenwood";
        const heading = dom.window.document.querySelector("h3").textContent;

        expect(heading).to.equal(indexPageHeading);
      });

      it("should have the expected paragraph text within the index page in the public directory", function () {
        const indexPageBody =
          "This is the home page built by Greenwood. Make your own pages in src/pages/index.js!";
        const paragraph = dom.window.document.querySelector("p").textContent;

        expect(paragraph).to.equal(indexPageBody);
      });

      it("should have a <meta> tag with custom og:site content in the <head>", function () {
        const metaElement = dom.window.document.querySelector('head meta[property="og:site"');

        expect(metaElement.getAttribute("content")).to.be.equal("The Greenhouse I/O");
      });

      it("should have a <meta> tag with custom og:url content in the <head>", function () {
        const metaElement = dom.window.document.querySelector('head meta[property="og:url"]');

        expect(metaElement.getAttribute("content")).to.be.equal("https://www.thegreenhouse.io");
      });

      it("should have a <meta> tag with custom twitter:site content in the <head>", function () {
        const metaElement = dom.window.document.querySelector('head meta[property="twitter:site"]');

        expect(metaElement.getAttribute("content")).to.be.equal("@thegreenhouseio");
      });
    });

    describe("Nested About page meta data", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("about/index.html", this.context.publicDir)),
        );
      });

      it("should output an index.html file within the about page directory", function () {
        expect(fs.existsSync(new URL("about/index.html", this.context.publicDir))).to.be.true;
      });

      it("should have a <meta> tag with custom og:site content in the <head>", function () {
        const metaElement = dom.window.document.querySelector('head meta[property="og:site"');

        expect(metaElement.getAttribute("content")).to.be.equal("The Greenhouse I/O");
      });

      it("should have a <meta> tag with custom og:url content in the <head>", function () {
        const metaElement = dom.window.document.querySelector('head meta[property="og:url"]');

        expect(metaElement.getAttribute("content")).to.be.equal("https://www.thegreenhouse.io");
      });

      it("should have a <meta> tag with custom twitter:site content in the <head>", function () {
        const metaElement = dom.window.document.querySelector('head meta[property="twitter:site"]');

        expect(metaElement.getAttribute("content")).to.be.equal("@thegreenhouseio");
      });
    });

    describe("favicon", function () {
      let dom;
      let favicons;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
        favicons = await Array.fromAsync(
          fs.promises.glob("*.svg", { cwd: new URL("./public", import.meta.url) }),
        );
      });

      it("should have one favicon.svg file in the output directory", function () {
        expect(favicons.length).to.equal(1);
      });

      it("should have our custom config <link> tag with shortcut icon in the <head> for the index page", function () {
        const linkElement = dom.window.document.querySelector('head link[rel="shortcut icon"]');

        expect(linkElement.getAttribute("href")).to.be.equal("/favicon.svg");
      });

      it("should have our custom config <link> tag with icon in the <head> for the index page", function () {
        const linkElement = dom.window.document.querySelector('head link[rel="icon"]');

        expect(linkElement.getAttribute("href")).to.be.equal("/favicon.svg");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
