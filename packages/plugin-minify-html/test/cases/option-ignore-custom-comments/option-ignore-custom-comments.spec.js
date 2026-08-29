/*
 * Use Case
 * Run Greenwood with Minify HTML composite plugin using the ignoreCustomComments option.
 *
 * User Result
 * Should generate a bare bones Greenwood build with minified HTML output where only comments
 * matching the user provided patterns are kept.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginMinifyHtml } from '@greenwood/plugin-minify-html';
 *
 * {
 *   plugins: [
 *     greenwoodPluginMinifyHtml({
 *       ignoreCustomComments: [/^KEEP/]
 *     })
 *   ]
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
import fs from "node:fs/promises";
import { expect } from "chai";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Minify HTML Plugin with ignoreCustomComments option and Default Workspace";
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
    let html;

    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      html = await fs.readFile(path.join(this.context.publicDir, "index.html"), "utf-8");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Minified HTML output with custom comment patterns", function () {
      it("should keep comments matching the user provided patterns", function () {
        expect(html).to.include("<!-- KEEP: banner -->");
      });

      it("should strip comments not matching the user provided patterns", function () {
        expect(html).to.not.include("a normal comment");
      });

      it("should strip the default preserved patterns when the user replaces them", function () {
        expect(html).to.not.include("lit-part");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
