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
import fs from "fs/promises";
import { JSDOM } from "jsdom";
import path from "path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "url";

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
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(initPath, ["--name", APP_NAME, "--ts", "no", "--install", "no"]);
    });

    describe(`should build with the Greenwood CLI and have all standard build output files`, function () {
      const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");

      before(function () {
        runner.setup(initOutputPath);
        runner.runCommand(cliPath, ["build"]);
      });

      runSmokeTest(["public", "index"], LABEL);

      describe("Build command specific HTML behaviors", function () {
        let dom;

        before(async function () {
          const html = await fs.readFile(path.join(initOutputPath, "public/index.html"), "utf-8");

          dom = new JSDOM(html);
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
    runner.teardown([initOutputPath]);
  });
});
