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
import { expect } from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace w/HUD enabled";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      hostname = await startServer(runner, cliPath, "develop");
      this.context.hostname = hostname;
    });

    runSmokeTest(["serve"], LABEL);

    describe("Develop command specific HUD HTML behaviors", function () {
      let response = {};
      let sourceHtml = "";
      let body;

      before(async function () {
        response = await fetch(`${hostname}`);
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

        expect(bodyTag.textContent).to.contain(
          "Malformed HTML detected, please check your closing tags or an HTML formatter",
        );
        expect(bodyTag.textContent.replace(/\\n/g, "").trim()).to.contain(
          sourceHtml.replace(/\\n/g, "").trim(),
        );

        done();
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
