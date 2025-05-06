/*
 * Use Case
 * Run Greenwood with custom markdown content and prerendering enabled with WCC.
 *
 * User Result
 * Should generate a bare bones Greenwood build and in particular make sure HTML entities are preserved.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [greenwoodPluginMarkdown()]
 *   prerender: true
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     ctc-block.js
 *   pages/
 *     index.md
 */
import fs from "fs/promises";
import path from "path";
import chai from "chai";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "url";

const expect = chai.expect;

// https://github.com/ProjectEvergreen/greenwood/issues/1375
describe("Build Greenwood With: ", function () {
  const LABEL = "Markdown with prerendering and HTML entities";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
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

    describe("Markdown Rendering", function () {
      let html;

      before(async function () {
        html = await fs.readFile(path.resolve(this.context.publicDir, "index.html"), "utf-8");
      });

      it("should correctly render out code fences with HTML entities preserved", function () {
        expect(html).to.contain("&lt;x-card&gt;");
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
