/*
 * Use Case
 * Run Greenwood build command with no config.
 *
 * User Result
 * Should generate a bare bones Greenwood build
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   pages/
 *     api/
 *       greeting.js
 */
import { expect } from "chai";
import glob from "glob-promise";
import fs from "node:fs/promises";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Config and API Routes";
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

    runSmokeTest(["public"]);

    describe("Default output", function () {
      it("should contain no HTML files in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("*.html", this.context.publicDir))),
        ).to.have.lengthOf(0);
      });

      it("should contain no JS files in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("*.html", this.context.publicDir))),
        ).to.have.lengthOf(0);
      });

      it("should contain one API route in the output directory", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("api/**/*.js", this.context.publicDir))),
        ).to.have.lengthOf(1);
      });

      it("should prefix all node import specifiers", async function () {
        const contents = await fs.readFile(
          new URL("./public/api/greeting.js", import.meta.url),
          "utf-8",
        );

        expect(contents).to.contain("node:assert/strict");
      });

      // https://github.com/ProjectEvergreen/greenwood/issues/1811
      it("should bundle CommonJS dependencies backed by Rollup virtual modules", async function () {
        const contents = await fs.readFile(
          new URL("./public/api/greeting.js", import.meta.url),
          "utf-8",
        );

        expect(contents).to.contain("multipart/form-data");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
