/*
 * Use Case
 * Scaffold from minimal template and run Greenwood build command.
 *
 * User Result
 * Should scaffold from template and run the build.
 *
 * User Command
 * @greenwood/init --install && greenwood build
 *
 * User Workspace
 * N / A
 */
import chai from "chai";
import fs from "fs";
import path from "path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

const expect = chai.expect;

// https://github.com/ProjectEvergreen/greenwood/issues/787
describe.only("Init Greenwood: ", function () {
  const LABEL = "Scaffold Greenwood with default prompts";
  const APP_NAME = "my-project";
  const initPath = path.join(process.cwd(), "packages/init/src/index.js");
  const outputPath = path.dirname(new URL(import.meta.url).pathname);
  const initOutputPath = path.join(outputPath, `/${APP_NAME}`);
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(initOutputPath, "public"),
    };
    runner = new Runner(true);
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(initPath, ["--name", APP_NAME]);
    });

    describe(`should build ${LABEL}`, function () {
      const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");

      before(function () {
        runner.setup(initOutputPath);
        runner.runCommand(cliPath, ["build"]);
      });

      runSmokeTest(["public", "index"], LABEL);

      it("should generate a package-lock.json file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "package-lock.json"))).to.be.true;
      });

      it("should not generate a yarn.lock file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "yarn.lock"))).to.be.false;
      });
    });
  });

  after(function () {
    // runner.teardown([initOutputPath]);
  });
});
