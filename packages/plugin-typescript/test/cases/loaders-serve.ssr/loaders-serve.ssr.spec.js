/*
 * Use Case
 * Run Greenwood with an API and SSR routes that import TypeScript.
 *
 * User Result
 * Should generate a Greenwood build that correctly builds and bundles all assets.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [
 *      greenwoodPluginTypeScript({
 *        servePages: 'dynamic'
 *      })
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     card.ts
 *     greeting.ts
 *   pages/
 *     api/
 *       fragment.js
 *       greeting.ts
 *     index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

xdescribe("Serve Greenwood With: ", function () {
  const LABEL = "A Server Rendered Application (SSR) with API Routes in TypeScript";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
      hostname,
    };
    runner = new Runner({ forwardParentArgs: true });
  });

  describe(LABEL, function () {
    before(async function () {
      runner.setup(outputUrl);
      runner.runCommand(cliUrl, { args: "build" });

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliUrl, { args: "serve" });
      });
    });

    describe('Serve command with API specific behaviors for an HTML ("fragment") API', function () {
      let response = {};
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/api/fragment`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return a custom status message", function () {
        expect(response.statusText).to.equal("OK");
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("text/html");
      });

      it("should make sure to have the expected CSS inlined into the page for each <app-card>", function (done) {
        const cardComponents = dom.window.document.querySelectorAll("body > app-card");

        expect(cardComponents.length).to.equal(2);
        Array.from(cardComponents).forEach((card) => {
          expect(card.innerHTML).contain("font-size: 1.85rem");
        });
        done();
      });
    });

    describe("Serve command with API specific behaviors for TypeScript authored API", function () {
      const name = "TypeScript";
      let response = {};
      let body;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/api/greeting?name=${name}`);
        body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return a custom status message", function () {
        expect(response.statusText).to.equal("OK");
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("text/html");
      });

      it("should make sure to have the expected CSS inlined into the page for each <app-card>", function (done) {
        const heading = dom.window.document.querySelectorAll("body > x-greeting");

        expect(heading.length).to.equal(1);
        expect(heading[0].innerHTML).contain(`<h3>Hello ${name}!`);

        done();
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
