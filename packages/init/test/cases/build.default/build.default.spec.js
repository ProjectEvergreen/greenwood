/*
 * Use Case
 * Scaffold from minimal template and run Greenwood build command.
 *
 * User Result
 * Should scaffold from template and run the build.
 *
 * User Command
 * npx @greenwood/init --name my-app && greenwood build
 *
 * User Workspace
 * N / A
 */
import chai from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffold Greenwood with default options and run a build";
  const APP_NAME = "my-app";
  const initPath = path.join(process.cwd(), "packages/init/src/index.js");
  const outputPath = path.dirname(fileURLToPath(new URL(import.meta.url)));
  const initOutputPath = path.join(outputPath, `/${APP_NAME}`);
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(initOutputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      runner.setup(outputPath);
      await runner.runCommand(initPath, ["--name", APP_NAME, "--ts", "no", "--install", "no"]);
    });

    describe(`should build with the Greenwood CLI and have all standard build output files`, function () {
      const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");

      before(async function () {
        runner.setup(initOutputPath);
        await runner.runCommand(cliPath, ["build"]);
      });

      runSmokeTest(["public", "index"], LABEL);

      describe("Build command specific HTML behaviors", function () {
        let dom;

        before(async function () {
          const html = await fs.readFile(path.join(initOutputPath, "public/index.html"), "utf-8");

          dom = new JSDOM(html);
        });

        it("should display default project title", function (done) {
          const title = dom.window.document.querySelectorAll("head > title");

          expect(title.length).to.equal(1);
          expect(title[0].textContent).to.equal("Greenwood");

          done();
        });

        it("should have the expected meta charset tag", function (done) {
          const meta = dom.window.document.querySelectorAll("meta[charset='utf-8']");

          expect(meta.length).to.equal(1);

          done();
        });

        it("should have the expected meta viewport tag", function (done) {
          const meta = dom.window.document.querySelectorAll("meta[name='viewport']");

          expect(meta.length).to.equal(1);
          expect(meta[0].getAttribute("content")).to.equal("width=device-width, initial-scale=1");

          done();
        });
      });
    });
  });

  after(function () {
    runner.teardown([initOutputPath]);
  });
});
