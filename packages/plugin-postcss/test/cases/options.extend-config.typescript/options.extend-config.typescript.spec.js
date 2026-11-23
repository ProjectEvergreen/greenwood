/*
 * Use Case
 * Run Greenwood with a custom PostCSS config written TypeScript
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's CSS file correctly un-nested and minified
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
 *
 * User postcss.config.js
 * export default {
 *   plugins: [
 *     (await import('postcss-nested')).default
 *   ]
 * };
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom PostCSS configuration using TypeScript";
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

    describe("Page referencing external nested CSS file", function () {
      it("should output correctly processed nested CSS as non nested", function () {
        const expectedCss = ":host{color:red}body{color:red}body h1{color:blue}";
        const cssFiles = glob.sync(fileURLToPath(new URL("styles/*.css", this.context.publicDir)));
        const css = fs.readFileSync(cssFiles[0], "utf-8");

        expect(cssFiles.length).to.equal(1);
        expect(css).to.equal(expectedCss);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
