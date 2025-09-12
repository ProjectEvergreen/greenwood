/*
 * Use Case
 * Run Greenwood with a single index.html file to build a SPA based project.
 *
 * User Result
 * Should generate a Greenwood build for a SPA.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * Greenwood default w/ single index.html file
 *  src/
 *   components/
 *     footer.js
 *   routes/
 *     about.js
 *     home.js
 *   index.js
 *   index.html
 */
import chai from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "A Single Page Application (SPA)";
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
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"], LABEL);

    describe("SPA (Single Page Application)", function () {
      let dom;
      let htmlFiles;
      let jsFiles;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
        htmlFiles = await glob(`${this.context.publicDir}/**/*.html`);
        jsFiles = await glob(`${this.context.publicDir}/**/*.js`);
      });

      it("should only have one HTML file in the output directory", function () {
        expect(htmlFiles.length).to.be.equal(1);
      });

      it("should output five script files in the output directory", function () {
        // one for each route (home, about)
        // one for the footer.js
        // one for index.js
        // one for lit element bundle
        expect(jsFiles.length).to.be.equal(5);
      });

      it("should have custom <title> tag in the <head>", function () {
        const title = dom.window.document.querySelectorAll("head > title");

        expect(title.length).to.be.equal(1);
        expect(title[0].textContent).to.be.equal("My Super SPA");
      });

      it("should have custom <meta> tag in the <head>", function () {
        const customMeta = Array.from(dom.window.document.querySelectorAll("head > meta")).filter(
          (meta) => meta.getAttribute("property") === "og:description",
        );

        expect(customMeta.length).to.be.equal(1);
        expect(customMeta[0].getAttribute("content")).to.be.equal("My custom meta content.");
      });

      it("should only have two script tags in the <head>", function () {
        expect(htmlFiles.length).to.be.equal(1);
      });

      it("should have one <script> tag in the <head> for index.js", function () {
        const indexScript = Array.from(
          dom.window.document.querySelectorAll("head > script[type]"),
        ).filter((script) => /index.*.js/.test(script.src));

        expect(indexScript.length).to.be.equal(1);
        expect(indexScript[0].type).to.be.equal("module");
      });

      it("should have one <script> tag in the <head> for the footer.js", function () {
        const footerScript = Array.from(
          dom.window.document.querySelectorAll("head > script[type]"),
        ).filter((script) => /footer.*.js/.test(script.src));

        expect(footerScript.length).to.be.equal(1);
        expect(footerScript[0].type).to.be.equal("module");
      });

      it("should have two code split route javascript files emitted based code splitting", function () {
        const aboutBundle = jsFiles.filter((file) => /about.*.js/.test(path.basename(file)));
        const homeBundle = jsFiles.filter((file) => /home.*.js/.test(path.basename(file)));

        expect(aboutBundle.length).to.equal(1);
        expect(homeBundle.length).to.equal(1);
      });

      it("should not have a pre-rendered custom footer", function () {
        const footer = dom.window.document.querySelector("app-footer");

        expect(footer.textContent).to.be.equal("");
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
