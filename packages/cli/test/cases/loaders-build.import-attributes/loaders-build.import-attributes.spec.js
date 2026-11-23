/*
 * Use Case
 * Run Greenwood serve command with no config for using import attributes with a basic static bundles.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {}
 *
 * User Workspace
 * src/
 *   components/
 *     card/
 *       asset-927.css
 *       card.css
 *       card.js
 *       card.json
 *   pages/
 *     index.html
 * package.json
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import path from "node:path";
import { Runner } from "gallinago";
import { getOutputTeardownFiles, HASH_REGEX } from "../../../../../test/utils.js";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Import Attributes used in static pages";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner({ forwardParentArgs: true });
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    describe("Custom Element Importing CSS w/ Constructable Stylesheet", function () {
      let scripts;
      let styles;
      let dollarSignStyles;

      before(async function () {
        scripts = await glob.promise(fileURLToPath(new URL("public/card.*.js", outputUrl)));
        styles = await glob.promise(fileURLToPath(new URL("public/card.*.css", outputUrl)));
        dollarSignStyles = await glob.promise(
          fileURLToPath(new URL("public/asset-927.*.css", outputUrl)),
        );
      });

      it("should reference the emitted global stylesheet without expanding filename replacement tokens", async function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");
        const themes = await glob.promise(
          fileURLToPath(new URL("public/styles/theme-*.css", outputUrl)),
        );

        expect(scripts.length).to.equal(1);
        expect(themes.length).to.equal(1);
        expect(path.basename(themes[0])).to.match(/^theme-\$&\.[a-zA-Z0-9_-]+\.css$/);
        expect(scriptContents).to.contain(`/styles/${path.basename(themes[0])}`);
        expect(scriptContents).to.match(
          new RegExp(
            `import r from"/styles/theme-\\$&\\.${HASH_REGEX}\\.css"with\\{type:"css"\\};`,
          ),
        );
      });

      it("should have the expected import attribute for importing card.css as a Constructable Stylesheet in the card.js bundle", function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");

        expect(scripts.length).to.equal(1);
        expect(scriptContents).to.match(
          new RegExp(`import a from"/card\\.${HASH_REGEX}\\.css"with\\{type:"css"\\};`),
        );
      });

      // This filename consistently produces the Rollup reference ID BAdZ7Z$$ across operating systems.
      // https://github.com/ProjectEvergreen/greenwood/issues/1816
      it("should bundle an import attribute whose Rollup reference ID contains two dollar signs", function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");

        expect(dollarSignStyles.length).to.equal(1);
        expect(scriptContents).to.contain(`/${path.basename(dollarSignStyles[0])}`);
      });

      it("should have the expected import attribute for importing @spectrum-css/card as a Constructable Stylesheet in the card.js bundle", function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");

        expect(scriptContents).to.match(
          /const ([A-Za-z_$][\w$]*)=new CSSStyleSheet;\1\.replaceSync\("\.spectrum-Card\{--spectrum-card-background-color/,
        );
      });

      it("should have the expected CSS output bundle for card.css", function () {
        const styleContents = fs.readFileSync(styles[0], "utf-8");

        expect(styles.length).to.equal(1);
        expect(styleContents).to.equal(":host{color:red}");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
