/*
 * Use Case
 * Run Greenwood build command with both a static sitemap.xml and a dynamic sitemap
 * module in the workspace.
 *
 * User Result
 * Should copy the static sitemap.xml to the output directory, taking precedence over
 * the dynamic sitemap module.
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
 *     index.html
 *   sitemap.xml
 *   sitemap.xml.js
 */
import { expect } from "chai";
import glob from "glob-promise";
import fs from "node:fs/promises";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Config and both a Static and Dynamic Sitemap";
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

    runSmokeTest(["public"]);

    describe("Static sitemap precedence", function () {
      it("should copy the static sitemap.xml to the output directory", async function () {
        const sitemap = await fs.readFile(
          path.join(this.context.publicDir, "sitemap.xml"),
          "utf-8",
        );

        expect(sitemap).to.contain("<loc>http://www.example.com/static/</loc>");
        expect(sitemap).to.not.contain("<loc>http://www.example.com/dynamic/</loc>");
      });

      it("should not emit a bundled sitemap module in the output directory", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "sitemap.xml.route*.js")),
        ).to.have.lengthOf(0);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
