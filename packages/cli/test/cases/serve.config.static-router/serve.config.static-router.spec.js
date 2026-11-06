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
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Static Router Configuration and Hybrid Workspace";
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
      await runner.runCommand(cliPath, "build");

      hostname = await startServer(runner, cliPath, "serve");
      this.context.hostname = hostname;
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
        expect(body).to.contain('<img src="/assets/analog.png" alt="Analog"/>');
        done();
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
