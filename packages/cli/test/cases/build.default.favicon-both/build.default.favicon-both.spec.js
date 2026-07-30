/*
 * Use Case
 * Run Greenwood build command with no config and a workspace that has both a favicon.ico and a favicon.svg.
 *
 * User Result
 * Should generate a bare bones Greenwood build with both favicon files copied to the output directory.
 * https://github.com/ProjectEvergreen/greenwood/issues/1739
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   favicon.ico
 *   favicon.svg
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL =
    "Default Greenwood Configuration and Workspace with both favicon.ico and favicon.svg";
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
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"], LABEL);

    describe("Default output for project level favicon.ico and favicon.svg", function () {
      it("should have a favicon.ico file in the output directory matching the source file", async function () {
        const source = await fs.readFile(path.join(outputPath, "src/favicon.ico"));
        const output = await fs.readFile(path.join(this.context.publicDir, "favicon.ico"));

        expect(output.equals(source)).to.equal(true);
      });

      it("should have a favicon.svg file in the output directory matching the source file", async function () {
        const source = await fs.readFile(path.join(outputPath, "src/favicon.svg"));
        const output = await fs.readFile(path.join(this.context.publicDir, "favicon.svg"));

        expect(output.equals(source)).to.equal(true);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
