/*
 * Use Case
 * Run Greenwood with an SSR route that exports static HTML.
 *
 * User Result
 * Should generate a bare bones Greenwood build with a statically rendered from server routes.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 *  src/
 *   components/
 *     counter.js
 *     footer.js
 *   pages/
 *     artists.js
 *   layouts/
 *     app.html
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

describe("Serve Greenwood With: ", function () {
  const LABEL = "A Server Rendered Application (SSR) that is statically exported";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const hostname = "http://127.0.0.1:8080";
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, "serve", { async: true });
      });
    });

    runSmokeTest(["public", "index", "serve"], LABEL);

    describe("Serve command that tests for static HTML export from SSR route", function () {
      let dom;
      let response;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/artists/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a response body", function (done) {
        expect(body).to.not.be.undefined;
        done();
      });

      it("should have one style tags", function () {
        const styles = dom.window.document.querySelectorAll("head > style");

        expect(styles.length).to.equal(1);
      });

      it("should have the expected number of script tags", function () {
        const scripts = Array.from(dom.window.document.querySelectorAll("head script")).filter(
          (tag) => !tag.getAttribute("data-gwd"),
        );

        expect(scripts.length).to.equal(3);
      });

      it("should have expected SSR content from the non module script tag", function () {
        const scripts = Array.from(
          Array.from(dom.window.document.querySelectorAll("head script")).filter(
            (tag) => !tag.getAttribute("data-gwd"),
          ),
        ).filter((tag) => !tag.getAttribute("type") && !tag.getAttribute("src"));

        expect(scripts.length).to.equal(1);
        expect(scripts[0].textContent).to.contain("console.log");
      });

      it("should have a bundled script for the footer component", function () {
        const footerScript = Array.from(
          dom.window.document.querySelectorAll("head > script[type]"),
        ).filter((script) => /footer.*[a-z0-9].js/.test(script.src));

        expect(footerScript.length).to.be.equal(1);
        expect(footerScript[0].type).to.be.equal("module");
      });

      it("should have the expected number of table rows of content", function () {
        const rows = dom.window.document.querySelectorAll("body > table tr");

        expect(rows.length).to.equal(11);
      });

      it("should have the expected <title> content in the <head>", function () {
        const title = dom.window.document.querySelectorAll("head > title");

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal("/artists/");
      });

      it("should have custom metadata in the <head>", function () {
        const metaDescription = Array.from(
          dom.window.document.querySelectorAll("head > meta"),
        ).filter((tag) => tag.getAttribute("name") === "description");

        expect(metaDescription.length).to.equal(1);
        expect(metaDescription[0].getAttribute("content")).to.equal(
          "/artists/ (this was generated server side!!!)",
        );
      });

      it("should append the expected <script> tag for a frontmatter import <x-counter> component", function () {
        const componentName = "counter";
        const counterScript = Array.from(
          dom.window.document.querySelectorAll("head > script[src]"),
        ).filter((tag) => tag.getAttribute("src").indexOf(`/${componentName}.`) === 0);

        expect(counterScript.length).to.equal(1);
      });

      it("should have no bundled SSR output for the page", async function () {
        const scriptFiles = (await glob.promise(path.join(this.context.publicDir, "*.js"))).filter(
          (file) => file.indexOf("artists.js") >= 0,
        );

        expect(scriptFiles.length).to.equal(0);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});
