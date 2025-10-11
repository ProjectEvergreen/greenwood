/*
 * Use Case
 * Run Greenwood with a pre-rendered HTML page that imports TypeScript.
 *
 * User Result
 * Should generate a Greenwood build that correctly builds and bundles all assets.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true,
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     card.ts
 *   pages/
 *     index.html
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Serve Greenwood With: ", function () {
  const LABEL =
    "A Prerendered Application (SSR) with an HTML page importing a TypeScript component";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://127.0.0.1:8080";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
      hostname,
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, "serve");
      });
    });

    describe("Serve command with SSR prerender specific behaviors for an HTML page", function () {
      let response = {};
      let body;
      let fragmentsApiDom;

      before(async function () {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
        fragmentsApiDom = new JSDOM(body);
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return a custom status message", function (done) {
        expect(response.statusText).to.equal("OK");
        done();
      });

      it("should have the expected pre-rendered app-card content", function (done) {
        const cardComponents = fragmentsApiDom.window.document.querySelectorAll("body > app-card");

        expect(cardComponents.length).to.equal(1);
        expect(cardComponents[0].innerHTML).to.contain("<h3>foo</h3>");

        done();
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
