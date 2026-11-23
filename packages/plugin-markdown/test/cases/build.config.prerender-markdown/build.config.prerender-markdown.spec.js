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
import fs from "node:fs/promises";
import { expect } from "chai";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

// https://github.com/ProjectEvergreen/greenwood/issues/1375
describe("Build Greenwood With: ", function () {
  const LABEL = "Markdown with prerendering and HTML entities";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
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

    runSmokeTest(["public", "index"], LABEL);

    describe("Markdown Rendering", function () {
      let html;

      before(async function () {
        html = await fs.readFile(new URL("index.html", this.context.publicDir), "utf-8");
      });

      it("should correctly render out code fences with HTML entities preserved", function () {
        expect(html).to.contain("&lt;x-card&gt;");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
