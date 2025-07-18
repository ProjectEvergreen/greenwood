/*
 * Use Case
 * Run Greenwood with default PostCSS config.
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
 *   pages/
 *     index.html
 *   styles/
 *     main.css
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
  const LABEL = "Default PostCSS configuration";
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
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
