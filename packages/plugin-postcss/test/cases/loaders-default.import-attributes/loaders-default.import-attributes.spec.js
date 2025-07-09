/*
 * Use Case
 * Run Greenwood with default PostCSS config when using Import Attributes.
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's CSS file correctly minified.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginPostCss } from '@greenwood/plugin-postcss';
 *
 * {
 *   plugins: [
 *     greenwoodPluginPostCss()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     header/
 *       header.js
 *       header.css
 *   pages/
 *     index.html
 *   styles/
 *     theme.css
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
  const LABEL = "Default PostCSS configuration and CSS Import Attributes";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Page referencing external nested CSS file", function () {
      it("should output correctly processed nested CSS as non nested", function () {
        const expectedCss = "body{color:red}h1{color:blue}";
        const cssFiles = glob.sync(path.join(this.context.publicDir, "styles", "*.css"));
        const css = fs.readFileSync(cssFiles[0], "utf-8");

        expect(cssFiles.length).to.equal(1);
        expect(css).to.equal(expectedCss);
      });

      it("should output correctly processed import attributes in header.js bundle output", function () {
        const headerFiles = glob.sync(path.join(this.context.publicDir, "header.*.js"));
        const js = fs.readFileSync(headerFiles[0], "utf-8");

        expect(headerFiles.length).to.equal(1);
        expect(
          js.indexOf('import e from"/styles/theme.548942254.css"with{type:"css"};') >= 0,
        ).to.equal(true);
        expect(js.indexOf('import t from"/header.VW6HLTom.css"with{type:"css"};') >= 0).to.equal(
          true,
        );
        expect(
          js.indexOf(
            "const s=new CSSStyleSheet;s.replaceSync('.spectrum{--spectrum-font-family-ar:myriad-arabic",
          ) >= 0,
        ).to.equal(true);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
