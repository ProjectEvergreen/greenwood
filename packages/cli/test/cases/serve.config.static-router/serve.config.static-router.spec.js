/*
 * Use Case
 * Run Greenwood with staticRouter setting in Greenwood to enable SPA like routing.
 *
 * User Result
 * Should serve a bare bones Greenwood build with support for static router navigation and SSR routes
 * to support hybrid workspaces.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   staticRouter: true
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     about.html
 *     artists.js
 *     index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Static Router Configuration and Hybrid Workspace";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://127.0.0.1:8080";
  let runner;

  before(function () {
    this.context = {
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

    runSmokeTest(["serve"], LABEL);

    describe("Serve command with SSR route with staticRouter config set", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/artists/`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("<h2>Analog</h2>");
        const image = new JSDOM(body).window.document.querySelector('img[alt="Analog"]');
        expect(image.getAttribute("src")).to.equal("/assets/analog.png");
        done();
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
