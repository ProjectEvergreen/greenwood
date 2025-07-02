/*
 * Use Case
 * Run Greenwood and get external  custom resource plugin and default workspace.
 *
 * User Result
 * Should generate a bare bones Greenwood build with expected artists data as static files using a custom layout.
 * Should also have a sitemap page.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const customExternalSourcesPlugin = {
 *   type: 'source',
 *   name: 'source-plugin-analogstudios',
 *   provider: () => {
 *     // see complete implementation in the greenwood.config.js file used for this spec
 *   }
 * }
 *
 * {
 *   plugins: [
 *     customExternalSourcesPlugin
 *   ]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     about.md
 *     index.md
 *   layouts/
 *     artist.html
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import fs from "node:fs/promises";
import glob from "glob-promise";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Sources Plugin and Custom Layout";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const publicDir = path.join(outputPath, "public");
  let runner;

  before(function () {
    this.context = {
      publicDir,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("About Page", function () {
      let pages;
      let dom;

      before(async function () {
        pages = await glob(`${publicDir}/about/index.html`);
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "about/index.html"));
      });

      it("should emit one about page", function () {
        expect(pages.length).to.equal(1);
      });

      it("should have expected heading content on the about page", function () {
        const heading = dom.window.document.querySelectorAll("body h1");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal("About Us");
      });

      it("should have expected paragraph content on the about page", function () {
        const paragraph = dom.window.document.querySelectorAll("body p");

        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.equal("Lorem ipsum.");
      });
    });

    describe("Artists Pages", function () {
      let fixtureData = {};
      let pages = [];
      let doms = [];

      before(async function () {
        fixtureData = JSON.parse(
          await fs.readFile(new URL("./data.json", import.meta.url), "utf-8"),
        );
        pages = await glob(`${publicDir}/artists/**/index.html`);
        doms = await Promise.all(
          pages.map(async (path) => {
            return JSDOM.fromFile(path);
          }),
        );
      });

      it("should emit three pages from source", function () {
        expect(pages.length).to.equal(3);
      });

      it("should have expected heading content for each artist page layout", function () {
        doms.forEach((dom) => {
          const headings = dom.window.document.querySelectorAll("body h1");

          expect(headings.length).to.equal(1);
          expect(headings[0].textContent).to.equal("Welcome to the artist page.");
        });
      });

      it("should have expected artist paragraph content for each artist page", function () {
        doms.forEach((dom, idx) => {
          const paragraphs = dom.window.document.querySelectorAll("body p");

          expect(paragraphs.length).to.equal(1);
          expect(paragraphs[0].textContent).to.equal(fixtureData[idx].bio);
        });
      });

      it("should have expected artist image content for each artist page", function () {
        doms.forEach((dom, idx) => {
          const images = dom.window.document.querySelectorAll("body img");

          expect(images.length).to.equal(1);
          expect(images[0].getAttribute("src")).to.equal(fixtureData[idx].imageUrl);
        });
      });
    });

    describe("Default output for Lügner2.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./Lügner2/index.html"));
      });

      it("should have a the expected heading text", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("Lügner2 Page");
      });
    });

    describe("Default output for First Post.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./First Post/index.html"));
      });

      it("should have a the expected heading text", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("First Post Page");
      });
    });

    describe("Sitemap Page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "sitemap/index.html"));
      });

      it("should have links to known pages", function () {
        const links = dom.window.document.querySelectorAll("body ul li a");

        expect(links.length).to.equal(3);
        const linkHrefs = Array.from(links).map((link) => link.getAttribute("href"));

        expect(linkHrefs).to.include("/about/");
        expect(linkHrefs).to.include("/");
        expect(linkHrefs).to.include("/404/");
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
