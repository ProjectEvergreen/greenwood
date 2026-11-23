/*
 * Use Case
 * Run Greenwood build command with none setting for optimization
 *
 * User Result
 * Should generate a Greenwood build that does not optimize any <script> and <link> tags
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'none'
 * }
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     theme.css
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "None Optimization Configuration";
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

    describe("Output for JavaScript / CSS tags and files", function () {
      let dom;
      let cssFiles;
      let jsFiles;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
        jsFiles = await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir)));
        cssFiles = await glob.promise(
          fileURLToPath(new URL("styles/theme.*.css", this.context.publicDir)),
        );
      });

      describe("<script> tag and preloading", function () {
        it("should contain one un-minified javascript file in the output directory", async function () {
          expect(jsFiles).to.have.lengthOf(1);
        });

        it("should output the contents of the JavaScript file un-minified", function () {
          const js = fs.readFileSync(jsFiles[0], "utf-8");

          expect(js).to.contain(
            'class HeaderComponent extends HTMLElement {\n  constructor() {\n    super();\n\n    this.root = this.attachShadow({ mode: "open" });\n    this.root.innerHTML = `\n      <header>This is the header component.</header>\n    `;\n  }\n}\n\ncustomElements.define("app-header", HeaderComponent);',
          );
        });

        it("should have the expected <script> tag in the <head>", function () {
          const src = jsFiles[0].replace(
            fileURLToPath(this.context.publicDir)
              .replace(/[/\\]$/, "")
              .replace(/\\/g, "/"),
            "",
          );
          const scriptTags = Array.from(
            dom.window.document.querySelectorAll('head script[type="module"]'),
          ).filter((tag) => tag.getAttribute("src") === src);

          expect(scriptTags.length).to.be.equal(1);
        });

        it("should have the expected preload <script> tag in the <head>", function () {
          const src = jsFiles[0].replace(
            fileURLToPath(this.context.publicDir)
              .replace(/[/\\]$/, "")
              .replace(/\\/g, "/"),
            "",
          );
          const scriptPreloadTags = Array.from(
            dom.window.document.querySelectorAll('head link[as="script"]'),
          );

          expect(scriptPreloadTags.length).to.be.equal(1);
          expect(scriptPreloadTags[0].getAttribute("href")).to.be.equal(src);
        });

        it("should contain the expected <app-header> in the <body>", function () {
          const header = dom.window.document.querySelectorAll("body app-header");

          expect(header.length).to.be.equal(1);
        });
      });

      describe("theme.css", function () {
        it("should contain one style.css in the output directory", async function () {
          expect(cssFiles).to.have.lengthOf(1);
        });

        it("should output the contents of the one CSS file", function () {
          const css = fs.readFileSync(cssFiles[0], "utf-8");

          expect(css).to.contain(
            '{\n  margin: 0;\n  padding: 0;\n  font-family: "Comic Sans", sans-serif;\n}',
          );
        });

        it("should have the expected preload <link> tag in the <head>", function () {
          const href = cssFiles[0].replace(
            fileURLToPath(this.context.publicDir)
              .replace(/[/\\]$/, "")
              .replace(/\\/g, "/"),
            "",
          );
          const linkPreloadTags = Array.from(
            dom.window.document.querySelectorAll('head link[as="style"]'),
          );

          expect(linkPreloadTags.length).to.be.equal(1);
          expect(linkPreloadTags[0].getAttribute("href")).to.be.equal(href);
        });

        it("should have the expected <link> tag href  for theme.css", function () {
          const href = cssFiles[0].replace(
            fileURLToPath(this.context.publicDir)
              .replace(/[/\\]$/, "")
              .replace(/\\/g, "/"),
            "",
          );
          const linkTags = Array.from(
            dom.window.document.querySelectorAll('head link[rel="stylesheet"]'),
          ).filter((tag) => tag.getAttribute("href") === href);

          expect(linkTags.length).to.be.equal(1);
        });
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
