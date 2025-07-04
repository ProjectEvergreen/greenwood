/*
 * Use Case
 * Run Greenwood build command with custom assets directory
 *
 * User Result
 * Should generate a Greenwood build with a public asset folder containing contents of assets directory
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Default Workspace
 */
import chai from "chai";
import fs from "node:fs";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "A Custom Assets Folder";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Assets folder", function () {
      it("should create a new assets directory", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "assets"))).to.be.true;
      });

      it("should contain files from the asset directory", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "assets", "./brand.png"))).to.be
          .true;
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
