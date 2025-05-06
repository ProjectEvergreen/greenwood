/*
 * Use Case
 * Run Greenwood build command with no config and custom 404 page in markldown with custom frontmatter exports (and app) layout.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom page layout.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [greenwoodPluginMarkdown()]
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     404.md
 *   scripts/
 *     404.js
 *     header.js
 *   styles/
 *     404.css
 *     theme.css
 *   layouts/
 *     app.html
 */
import chai from "chai";
import fs from "fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL =
    "Default Greenwood Configuration and Workspace w/Custom 404 Page in markdown and App Layout";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
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

    runSmokeTest(["public"], LABEL);

    describe("Custom 404 Page with App Layout", function () {
      let dom;
      let jsFiles;
      let cssFiles;
      let scriptTags;
      let linkTags;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "404.html"));
        jsFiles = await glob.promise(path.join(this.context.publicDir, "404.*.js"));
        cssFiles = await glob.promise(path.join(this.context.publicDir, "styles/404.*.css"));
      });

      before(function () {
        scriptTags = Array.from(dom.window.document.querySelectorAll("head > script")).filter(
          (tag) => !tag.getAttribute("data-gwd"),
        );
        linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
      });

      describe("404 page static assets in the output directory", function () {
        it("should have 1 404 JS file", function () {
          expect(jsFiles.length).to.equal(1);
        });

        it("should have 1 404 CSS file", function () {
          expect(cssFiles.length).to.equal(1);
        });
      });

      describe("404 page <head>", function () {
        // title tag
        it("should have 2 <script> tags in the <head>", function () {
          expect(scriptTags.length).to.equal(2);
        });

        it("should have 2 <link> tags in the <head>", function () {
          expect(linkTags.length).to.equal(2);
        });

        it("should have 1 app layout specific <script> tag in the <head>", function () {
          const scriptTagsLayout = Array.from(scriptTags).filter(
            (script) => script.getAttribute("src").indexOf("404") < 0,
          );

          expect(scriptTagsLayout.length).to.equal(1);
        });

        it("should have 1 app layout specific <link> tag in the <head>", function () {
          const linkTagsLayout = Array.from(linkTags).filter(
            (link) => link.getAttribute("href").indexOf("404") < 0,
          );

          expect(linkTagsLayout.length).to.equal(1);
        });

        it("should have 1 404 page specific <script> tags in the <head>", function () {
          const scriptTags404 = Array.from(scriptTags).filter(
            (script) => script.getAttribute("src").indexOf("404") >= 0,
          );

          expect(scriptTags404.length).to.equal(1);
        });

        it("should have 1 404 page specific <link> tags in the <head>", function () {
          const linkTags404 = Array.from(linkTags).filter(
            (link) => link.getAttribute("href").indexOf("404") >= 0,
          );

          expect(linkTags404.length).to.equal(1);
        });
      });

      describe("404 page <body>", function () {
        it("should have <app-header> component in the <body>", function () {
          const header = dom.window.document.querySelectorAll("body app-header");

          expect(header.length).to.equal(1);
        });

        it("should have 404 page specific content in the <body>", function () {
          const heading = dom.window.document.querySelectorAll("body h1");

          expect(heading.length).to.equal(1);
          expect(heading[0].textContent).to.equal("This is not the page you are looking for.");
        });

        it("should not have any sourcemap inlining for Rollup HTML entry points", function () {
          const html = fs.readFileSync(path.resolve(this.context.publicDir, "404.html"), "utf-8");

          expect(html).not.to.contain(/\/\/# sourceMappingURL=(.*)\.html\.map/);
        });
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
