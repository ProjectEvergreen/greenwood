/*
 * Use Case
 * Run Greenwood with an API and SSR routes that imports TypeScript for development.
 *
 * User Result
 * Should generate a Greenwood build that correctly runs in development mode.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * n / a
 *
 * User Workspace
 *  src/
 *   components/
 *     greeting.css
 *     greeting.ts
 *   pages/
 *     api/
 *       greeting.ts
 *     index.ts
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "A Server Rendered Application (SSR) with API Routes in TypeScript";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://127.0.0.1:1984";
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
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, "develop", { async: true });
      });
    });

    describe("Develop command for an SSR page written in TypeScript", function () {
      let response = {};
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/`);
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

      it("should make sure to have the expected HTML output with SSR for the <x-greeting> component", function () {
        const greetingComponents = dom.window.document.querySelectorAll("body > x-greeting");
        const greetingContentsDom = new JSDOM(greetingComponents[0].innerHTML);
        const greeting = greetingContentsDom.window.document.querySelectorAll("h3");

        expect(greetingComponents.length).to.equal(1);
        expect(greeting.length).to.equal(1);
        expect(greeting[0].textContent.trim()).to.equal("Hello About Page!");
      });
    });

    describe("Develop command for an API route written in TypeScript", function () {
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

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});
