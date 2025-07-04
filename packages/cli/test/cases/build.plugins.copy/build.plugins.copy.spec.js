/*
 * Use Case
 * Run Greenwood build command with custom copy plugin with deeply nested directories
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
import glob from "glob-promise";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "A Custom Copy Plugin";
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
    before(async function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Copy Directory", function () {
      it("should create the expected output folder for prism.css assets", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "node_modules/prismjs/themes"))).to
          .be.true;
      });

      it("should contain files from the asset directory", async function () {
        expect(
          await glob.promise(
            path.join(this.context.publicDir, "node_modules/prismjs/themes/*.css"),
          ),
        ).to.have.lengthOf(16);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
