/*
 * Use Case
 * Run Greenwood with TypeScript processing for pages, layouts and scripts.
 *
 * User Result
 * Should generate a Greenwood build using Greenwood's built-in TypeScript support.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * N / A
 *
 * User Workspace
 *  src/
 *   layouts/
 *     app.ts
 *   pages/
 *     index.html
 *   scripts/
 *     main.ts
 *
 * Default Config
 *
 */
import chai from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Default TypeScript type-stripping";
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
    before(async function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"], LABEL);

    describe("TypeScript based App Layout should should generate the expected HTML for the home page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should have the correct app.ts layout <title> tag contents", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("TypeScript App Layout");
      });

      it("should have the correct app.ts layout <h1> tag contents", function () {
        const heading = dom.window.document.querySelector("h1").textContent;

        expect(heading).to.be.equal("TypeScript App Layout");
      });

      it("should have the correct index.html page <h2> tag contents", function () {
        const heading = dom.window.document.querySelector("h3").textContent;

        expect(heading).to.be.equal("Hello World!");
      });
    });

    describe("TypeScript based Custom Page Layout should generate the expected HTML for the Contact Page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./contact/index.html"));
      });

      it("should have the correct blog.ts layout <title> tag contents", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("TypeScript App Layout");
      });

      it("should have the correct blog.ts layout <h1> tag contents", function () {
        const heading = dom.window.document.querySelector("h1").textContent;

        expect(heading).to.be.equal("TypeScript App Layout");
      });

      it("should have the correct blog.ts layout <h1> tag contents", function () {
        const heading = dom.window.document.querySelector("h2").textContent;

        expect(heading).to.be.equal("Default Page Layout");
      });

      it("should have the correct index.html page <h3> tag contents", function () {
        const heading = dom.window.document.querySelector("h3").textContent;

        expect(heading).to.be.equal("Contact Page");
      });

      it("should have the correct index.html page <p> tag contents", function () {
        const heading = dom.window.document.querySelector("p").textContent;

        expect(heading).to.be.equal("Please reach out!");
      });
    });

    describe("TypeScript based Custom Page Layout should generate the expected HTML for the Blog Page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./blog/index.html"));
      });

      it("should have the correct page.ts layout <title> tag contents", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("TypeScript Blog Page Layout");
      });

      it("should have the correct app.ts layout <h1> tag contents", function () {
        const heading = dom.window.document.querySelector("h1").textContent;

        expect(heading).to.be.equal("TypeScript App Layout");
      });

      it("should have the correct index.html page <h2> tag contents", function () {
        const heading = dom.window.document.querySelector("h2").textContent;

        expect(heading).to.be.equal("TypeScript Blog Page Layout");
      });

      it("should have the correct index.html page <h3> tag contents", function () {
        const heading = dom.window.document.querySelector("h3").textContent;

        expect(heading).to.be.equal("My Blog Posts");
      });

      it("should have the correct index.html page <p> tag contents", function () {
        const heading = dom.window.document.querySelector("p").textContent;

        expect(heading).to.be.equal("Lorum Ipsum");
      });
    });

    describe("TypeScript in a <script> tag should get correctly processed as JavaScript", function () {
      it("should output correctly processed JavaScript without the interface", function () {
        const jsFiles = glob.sync(path.join(this.context.publicDir, "*.js"));
        const javascript = fs.readFileSync(jsFiles[0], "utf-8");

        expect(jsFiles.length).to.equal(1);
        expect(javascript.replace(/\n/g, "")).to.contain(
          'const o="Angela",l="Davis",s="Professor";console.log(`Hello ${s} ${o} ${l}!`);',
        );
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
