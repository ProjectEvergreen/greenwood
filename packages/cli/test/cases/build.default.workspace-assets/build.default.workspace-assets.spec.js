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
 * User Workspace
 * src/
 *   assets/
 *     brand.png
 */
import { expect } from "chai";
import fs from "node:fs";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "A Custom Assets Folder";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public"], LABEL);

    describe("Assets folder", function () {
      it("should create a new assets directory", function () {
        expect(fs.existsSync(new URL("assets", this.context.publicDir))).to.be.true;
      });

      it("should contain files from the asset directory", function () {
        expect(fs.existsSync(new URL("assets/brand.png", this.context.publicDir))).to.be.true;
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
