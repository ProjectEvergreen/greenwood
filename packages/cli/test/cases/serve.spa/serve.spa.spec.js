/*
 * Use Case
 * Run Greenwood serve command for SPA based project.
 *
 * User Result
 * Should start the development server for a SPA with client side routing support.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {}
 *
 * User Workspace
 * src/
 *   index.html
 *   main.css
 *
 */
import { expect } from "chai";
import fs from "node:fs";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

function removeWhiteSpace(string = "") {
  return string.replace(/\n/g, "").replace(/ /g, "");
}

describe("Serve Greenwood With: ", function () {
  const LABEL = "A Single Page Application (SPA)";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
  const BODY_REGEX = /<body>(.*)<\/body>/s;
  const expected = removeWhiteSpace(
    fs
      .readFileSync(path.join(outputPath, `src${path.sep}index.html`), "utf-8")
      .match(BODY_REGEX)[0],
  );

  let runner;

  before(function () {
    this.context = {
      hostname,
      publicDir: path.join(outputPath, "public"),
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

    runSmokeTest(["public"], LABEL);

    describe("Serve command specific HTML behaviors for client side routing at root - /", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      it("should return the expected body contents", function (done) {
        expect(removeWhiteSpace(body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });

    describe("Serve command specific HTML behaviors for client side routing at 1 level route - /<resource>", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/artists/`);
        body = await response.clone().text();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      it("should return the expected body contents", function (done) {
        expect(removeWhiteSpace(body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });

    describe("Serve command specific HTML behaviors for client side routing at 1 level route - /<resource>/:id", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/artists/1`);
        body = await response.clone().text();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      it("should return the expected body contents", function (done) {
        expect(removeWhiteSpace(body.match(BODY_REGEX)[0])).to.equal(expected);
        done();
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
