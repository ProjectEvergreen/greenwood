/*
 * Use Case
 * Scaffold from minimal template and run Greenwood develop command with no config.
 *
 * User Result
 * Should scaffold from template and start the development server and render the template.
 *
 * User Command
 * @greenwood/init --name my-app && greenwood develop
 *
 * User Workspace
 * N / A
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffold Greenwood with default options and run the development server";
  const APP_NAME = "my-app";
  const initPath = path.join(process.cwd(), "packages/init/src/index.js");
  const outputPath = path.dirname(fileURLToPath(new URL(import.meta.url)));
  const initOutputPath = path.join(outputPath, `/${APP_NAME}`);
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
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(initPath, ["--name", APP_NAME, "--ts", "no", "--install", "no"]);
    });

    describe("should run the Greenwood dev server", function () {
      const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");

      before(async function () {
        runner.setup(initOutputPath);

        return new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 5000);

          runner.runCommand(cliPath, "develop", { async: true });
        });
      });

      runSmokeTest(["serve"], LABEL);

      describe("Develop command specific HTML behaviors", function () {
        let response = {};
        let dom;

        before(async function () {
          response = await fetch(`${hostname}:${port}/`);
          const data = await response.text();

          dom = new JSDOM(data);
        });

        it("should return the correct content type", function (done) {
          expect(response.headers.get("content-type")).to.equal("text/html");
          done();
        });

        it("should return a 200", function (done) {
          expect(response.status).to.equal(200);

          done();
        });

        it("should display default project title", function (done) {
          const title = dom.window.document.querySelector("head > title");

          expect(title.textContent).to.equal("Greenwood");

          done();
        });
      });
    });
  });

  after(function () {
    runner.stopCommand();
    runner.teardown([initOutputPath]);
  });
});
