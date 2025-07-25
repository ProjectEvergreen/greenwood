/*
 * Use Case
 * Run Greenwood build command with no config.
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
 * Greenwood default (src/)
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
  const LABEL = "Default Greenwood Configuration and Workspace";
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

      describe("default <head> section content", function () {
        let metaTags;

        before(function () {
          metaTags = dom.window.document.querySelectorAll("head > meta");
        });

        it("should have a <title> tag in the <head>", function () {
          const title = dom.window.document.querySelector("head title").textContent;

          expect(title).to.be.equal("My App");
        });

        it("should have five default <meta> tags in the <head>", function () {
          expect(metaTags.length).to.be.equal(5);
        });

        it("should have default mobile-web-app-capable <meta> tag", function () {
          const mwacMeta = metaTags[2];

          expect(mwacMeta.getAttribute("name")).to.be.equal("mobile-web-app-capable");
          expect(mwacMeta.getAttribute("content")).to.be.equal("yes");
        });

        it("should have default apple-mobile-web-app-capable <meta> tag", function () {
          const amwacMeta = metaTags[3];

          expect(amwacMeta.getAttribute("name")).to.be.equal("apple-mobile-web-app-capable");
          expect(amwacMeta.getAttribute("content")).to.be.equal("yes");
        });

        it("should have default apple-mobile-web-app-status-bar-style <meta> tag", function () {
          const amwasbsMeta = metaTags[4];

          expect(amwasbsMeta.getAttribute("name")).to.be.equal(
            "apple-mobile-web-app-status-bar-style",
          );
          expect(amwasbsMeta.getAttribute("content")).to.be.equal("black");
        });

        it("should add a <script> tag for tracking basePath configuration", function (done) {
          const scriptTags = Array.from(dom.window.document.querySelectorAll("head > script"));
          const basePathScript = scriptTags.filter((tag) => {
            return tag.getAttribute("data-gwd") === "base-path";
          });

          expect(basePathScript.length).to.equal(1);
          expect(basePathScript[0].textContent).to.contain('globalThis.__GWD_BASE_PATH__=""');
          done();
        });
      });
    });

    describe("Default output for 404.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./404.html"));
      });

      describe("default <head> tags", function () {
        let metaTags;

        before(function () {
          metaTags = dom.window.document.querySelectorAll("head > meta");
        });

        it("should have a <title> tag in the <head>", function () {
          const title = dom.window.document.querySelector("head title").textContent;

          expect(title).to.be.equal("Page Not Found");
        });

        it("should have five default <meta> tags in the <head>", function () {
          expect(metaTags.length).to.be.equal(5);
        });

        it("should have default mobile-web-app-capable <meta> tag", function () {
          const mwacMeta = metaTags[2];

          expect(mwacMeta.getAttribute("name")).to.be.equal("mobile-web-app-capable");
          expect(mwacMeta.getAttribute("content")).to.be.equal("yes");
        });

        it("should have default apple-mobile-web-app-capable <meta> tag", function () {
          const amwacMeta = metaTags[3];

          expect(amwacMeta.getAttribute("name")).to.be.equal("apple-mobile-web-app-capable");
          expect(amwacMeta.getAttribute("content")).to.be.equal("yes");
        });

        it("should have default apple-mobile-web-app-status-bar-style <meta> tag", function () {
          const amwasbsMeta = metaTags[4];

          expect(amwasbsMeta.getAttribute("name")).to.be.equal(
            "apple-mobile-web-app-status-bar-style",
          );
          expect(amwasbsMeta.getAttribute("content")).to.be.equal("black");
        });
      });

      describe("default <body> content", function () {
        it("should have the expected heading text within the index page in the public directory", function () {
          const heading = dom.window.document.querySelector("body h1").textContent;

          expect(heading).to.equal("Sorry, unfortunately the page could not be found.");
        });
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
