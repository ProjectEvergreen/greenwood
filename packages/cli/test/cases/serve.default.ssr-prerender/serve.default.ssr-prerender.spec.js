/*
 * Use Case
 * Run Greenwood with an SSR route that is prerender using configuration.
 *
 * User Result
 * Should generate a Greenwood build with a prerendered application shell and runtime SSR content.
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
 *     social-links.js
 *   pages/
 *     index.js
 *   layouts/
 *     app.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";

describe("Serve Greenwood With: ", function () {
  const LABEL = "A Server Rendered Application (SSR) with prerender configuration";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const hostname = "http://127.0.0.1:8080";
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliUrl, {
            args: "serve",
            onStdOut: (message) => {
              if (message.includes("Started server at http://localhost:8080")) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    runSmokeTest(["public", "serve"], LABEL);

    describe("Serve command that prerenders SSR pages", function () {
      let dom;
      let response;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      describe("Serve command with HTML response for the home page", function () {
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

        it("should have the expected output for the page", function () {
          const headings = dom.window.document.querySelectorAll("body > h1");

          expect(headings.length).to.equal(1);
          expect(headings[0].textContent).to.equal("This is the home page.");
        });

        it("should have the expected output for the footer component", function () {
          const footer = dom.window.document.querySelectorAll(
            'body app-footer template[shadowrootmode="open"]',
          );

          expect(footer.length).to.equal(1);
          expect(footer[0].innerHTML.trim()).to.equal(
            "<footer>This is the footer component.</footer>",
          );
        });

        // specifically to test for these bugs
        // https://github.com/ProjectEvergreen/greenwood/issues/1044
        // https://github.com/ProjectEvergreen/greenwood/issues/988#issuecomment-1288168858
        it("should have the expected number of items pre-rendered for the two <app-social-links> tags", function () {
          // one set comes from the HTML, one from the SSR page
          const links = dom.window.document.querySelectorAll("body > app-social-links ul li a");

          expect(links.length).to.equal(6);
        });

        it("should have the expected bundled SSR output for the page", async function () {
          const scriptFiles = await glob.promise(
            fileURLToPath(new URL("index.route*.js", this.context.publicDir)),
          );

          expect(scriptFiles.length).to.equal(2);
        });

        it("should not emit static HTML for the SSR page", async function () {
          const htmlFiles = await glob.promise(
            fileURLToPath(new URL("index.html", this.context.publicDir)),
          );

          expect(htmlFiles.length).to.equal(0);
        });

        it("should have no _layouts/ output directory for the app", async function () {
          const layoutFiles = await glob.promise(
            fileURLToPath(new URL("_layouts/*", this.context.publicDir)),
          );

          expect(layoutFiles.length).to.equal(0);
        });
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
