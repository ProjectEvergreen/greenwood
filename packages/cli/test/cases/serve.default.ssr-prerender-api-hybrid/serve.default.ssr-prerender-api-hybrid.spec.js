/*
 * Use Case
 * Run Greenwood with an SSR route that uses prerender configuration and also uses API routes.
 *
 * User Result
 * Should generate a Greenwood build with a prerendered application shell, runtime SSR content,
 * and API route handling.
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
 *   pages/
 *     api/
 *       greeting.js
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

// https://github.com/ProjectEvergreen/greenwood/issues/1099
describe("Serve Greenwood With: ", function () {
  const LABEL = "A Server Rendered Application (SSR) with prerender configuration and API routes";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const hostname = "http://127.0.0.1:8080";
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(async function () {
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
      });

      describe("Serve command for runtime HTML response with bundled home page <script> tag", function () {
        it("should have the expected <script> tags in <head>", function (done) {
          const scripts = Array.from(dom.window.document.querySelectorAll("head > script")).filter(
            (tag) => !tag.getAttribute("data-gwd"),
          );
          expect(scripts.length).to.equal(1);
          done();
        });

        it("should have the expected bundled filename", function (done) {
          const script = Array.from(dom.window.document.querySelectorAll("head > script")).filter(
            (tag) => !tag.getAttribute("data-gwd"),
          )[0];

          expect(script.getAttribute("src")).to.match(/^\/footer.*.js/);
          done();
        });
      });
    });

    describe("Serve command with API specific behaviors for a JSON API", function () {
      const name = "Greenwood";
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}/api/greeting?name=${name}`);
        data = await response.clone().json();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("application/json");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(data.message).to.equal(`Hello ${name}!!!`);
        done();
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
