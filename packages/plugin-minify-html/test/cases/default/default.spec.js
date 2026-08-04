/*
 * Use Case
 * Run Greenwood with Minify HTML composite plugin with default options.
 *
 * User Result
 * Should generate a bare bones Greenwood build with minified HTML output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginMinifyHtml } from '@greenwood/plugin-minify-html';
 *
 * {
 *   plugins: [greenwoodPluginMinifyHtml()]
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
  const LABEL = "Minify HTML Plugin with default options and Default Workspace";
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

    describe("Minified HTML output", function () {
      it("should strip authoring comments", function () {
        expect(html).to.not.include("authoring comment that should be removed");
      });

      it("should keep license style comments", function () {
        expect(html).to.include("<!--! legalese that should be kept -->");
      });

      it("should keep Lit SSR hydration marker comments", function () {
        expect(html).to.include("<!--lit-part abc123=-->");
        expect(html).to.include("<!--/lit-part-->");
      });

      it("should collapse indentation whitespace between tags", function () {
        expect(html).to.not.match(/\n\s+</);
      });

      it("should keep a single space between adjacent inline elements", function () {
        expect(html).to.include("<span>inline</span> <span>gap</span>");
      });

      it("should leave <pre> content untouched", function () {
        expect(html).to.include("<pre>keep\n  these lines</pre>");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
