/*
 * Use Case
 * Run Greenwood develop command with no config and invalid HTML in the <body> tag.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build with message in the HUD (heads up display).
 *
 * User Command
 * greenwood develop
 *
 * User Config (default)
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
import chai from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace w/HUD disabled";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1984;
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      runner.setup(outputPath);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, "develop", { async: true });
      });
    });

    runSmokeTest(["serve"], LABEL);

    describe("Develop command specific HUD HTML behaviors when disabled", function () {
      let response = {};
      let sourceHtml = "";
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${port}`);
        body = await response.clone().text();
        sourceHtml = fs.readFileSync(
          fileURLToPath(new URL("./src/pages/index.html", import.meta.url)),
          "utf-8",
        );
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      it("should contain the appropriate HUD output in the response", function (done) {
        const dom = new JSDOM(body);
        const bodyTag = dom.window.document.querySelectorAll("body")[0];

        expect(bodyTag.textContent).not.to.contain(
          "Malformed HTML detected, please check your closing tags or an HTML formatter",
        );
        expect(bodyTag.textContent.replace(/\\n/g, "").trim()).not.to.contain(
          sourceHtml.replace(/\\n/g, "").trim(),
        );

        done();
      });
    });
  });

  after(function () {
    runner.stopCommand();
    runner.teardown([path.join(outputPath, ".greenwood"), path.join(outputPath, "node_modules")]);
  });
});
