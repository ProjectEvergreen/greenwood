/*
 * Use Case
 * Scaffold from minimal template and install dependencies with pnpm.
 *
 * User Result
 * Should scaffold from template and with lockfile.
 *
 * User Command
 * npx @greenwood/init --name=my-app --install pnpm
 *
 * User Workspace
 * N / A
 */
import chai from "chai";
import fs from "fs";
import path from "path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "url";

const expect = chai.expect;

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffolding a new project with dependencies installed through PNPM";
  const APP_NAME = "my-app";
  const initPath = path.join(process.cwd(), "packages/init/src/index.js");
  const outputPath = path.dirname(fileURLToPath(new URL(import.meta.url)));
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
      runner.runCommand(initPath, ["--name", APP_NAME, "--install", "pnpm"]);
    });

    describe("should install with pnpm", function () {
      const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");

      before(function () {
        runner.setup(initOutputPath);
        runner.runCommand(cliPath, "build");
      });

      runSmokeTest(["public", "index"], LABEL);

      it("should generate a pnpm-lock.yaml file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "pnpm-lock.yaml"))).to.be.true;
      });
    });
  });

  after(function () {
    runner.teardown([initOutputPath]);
  });
});
