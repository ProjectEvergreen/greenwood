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
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles, HASH_REGEX } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default PostCSS configuration and CSS Import Attributes";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner({ forwardParentArgs: true });
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Page referencing external nested CSS file", function () {
      it("should output correctly processed nested CSS as non nested", function () {
        const expectedCss = "body{color:red}h1{color:blue}";
        const cssFiles = glob.sync(fileURLToPath(new URL("styles/*.css", this.context.publicDir)));
        const css = fs.readFileSync(cssFiles[0], "utf-8");

        expect(cssFiles.length).to.equal(1);
        expect(css).to.equal(expectedCss);
      });

      it("should output correctly processed import attributes in header.js bundle output", function () {
        const headerFiles = glob.sync(
          fileURLToPath(new URL("header.*.js", this.context.publicDir)),
        );
        const js = fs.readFileSync(headerFiles[0], "utf-8");

        const themeRegex = new RegExp(
          `import e from"/styles/theme.${HASH_REGEX}.css"with{type:"css"};`,
        );
        const headerRegex = new RegExp(`import t from"/header.${HASH_REGEX}.css"with{type:"css"};`);

        expect(headerFiles.length).to.equal(1);
        expect(js).to.match(themeRegex);
        expect(js).to.match(headerRegex);
        expect(
          js.indexOf(
            "const s=new CSSStyleSheet;s.replaceSync('.spectrum{--spectrum-font-family-ar:myriad-arabic",
          ) >= 0,
        ).to.equal(true);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
