/*
 * Use Case
 * Run Greenwood build command with various override settings for optimization settings.
 *
 * User Result
 * Should generate a Greenwood build that respects optimization setting overrides for all <script> and <link> tags.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * Default
 *
 * Custom Workspace
 * src/
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     index.html
 *   styles/
 *     theme.css
 */
import chai from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Optimization Overrides";
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

    describe("Cumulative output based on all override settings", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should emit no Javascript files to the output directory", async function () {
        const jsFiles = await glob.promise(path.join(this.context.publicDir, "**/*.js"));

        expect(jsFiles).to.have.lengthOf(0);
      });

      it("should emit no CSS files to the output directory", async function () {
        const cssFiles = await glob.promise(path.join(this.context.publicDir, "**/*.css"));

        expect(cssFiles).to.have.lengthOf(0);
      });

      it("should have one <script> tag in the <head>", function () {
        const scriptTags = Array.from(
          dom.window.document.querySelectorAll('head script[type="module"]'),
        ).filter((tag) => !tag.getAttribute("data-gwd"));

        expect(scriptTags.length).to.be.equal(1);
      });

      it("should have two <style> tags in the <head>", function () {
        const styleTags = dom.window.document.querySelectorAll("head style");

        expect(styleTags.length).to.be.equal(1);
      });

      it("should have no <link> tags in the <head>", function () {
        const linkTags = dom.window.document.querySelectorAll("head link");

        expect(linkTags.length).to.be.equal(0);
      });
    });

    describe("JavaScript <script> tag and static optimization override for <app-header>", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should contain no <link> tags in the <head>", function () {
        const headerLinkTags = Array.from(dom.window.document.querySelectorAll("head link")).filter(
          (link) => link.getAttribute("href").indexOf("header") >= 0,
        );

        expect(headerLinkTags.length).to.be.equal(0);
      });

      it("should have no <script> tags in the <head>", function () {
        const headerScriptTags = Array.from(
          dom.window.document.querySelectorAll("head script"),
        ).filter(
          (script) =>
            script.getAttribute("src") && script.getAttribute("src").indexOf("header") >= 0,
        );

        expect(headerScriptTags.length).to.be.equal(0);
      });
    });

    describe("JavaScript <script> tag and inline optimization override for <app-footer>", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should contain no <link> tags in the <head>", function () {
        const footerLinkTags = Array.from(dom.window.document.querySelectorAll("head link")).filter(
          (link) => link.getAttribute("href").indexOf("footer") >= 0,
        );

        expect(footerLinkTags.length).to.be.equal(0);
      });

      it("should have an inline <script> tag in the <head>", function () {
        const footerScriptTags = Array.from(
          dom.window.document.querySelectorAll("head script"),
        ).filter((script) => {
          return (
            script.textContent.indexOf(
              'const e=document.createElement("template");e.innerHTML="<footer>This is the footer component.</footer>";class t extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.shadowRoot.appendChild(e.content.cloneNode(!0))}}customElements.define("app-footer",t);',
            ) >= 0 && !script.getAttribute("src")
          );
        });

        expect(footerScriptTags.length).to.be.equal(1);
      });
    });

    describe("CSS <link> tag and inline optimization override for theme.css", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should contain no <link> tags in the <head>", function () {
        const themeLinkTags = Array.from(dom.window.document.querySelectorAll("head link")).filter(
          (link) => link.getAttribute("href").indexOf("theme") >= 0,
        );

        expect(themeLinkTags.length).to.be.equal(0);
      });

      it("should have an inline <style> tag in the <head>", function () {
        const themeStyleTags = Array.from(
          dom.window.document.querySelectorAll("head style"),
        ).filter((style) => style.textContent.trim() === "*{color:blue}");

        expect(themeStyleTags.length).to.be.equal(1);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
