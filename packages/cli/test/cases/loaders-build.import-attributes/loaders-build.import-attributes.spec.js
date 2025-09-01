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
 *       card.css
 *       card.js
 *       card.json
 *   pages/
 *     index.html
 * package.json
 */
import chai from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import path from "node:path";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { fileURLToPath } from "node:url";
import { HASH_8_REGEX } from "../../../src/lib/hashing-utils.js";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Import Attributes used in static pages";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    describe("Custom Element Importing CSS w/ Constructable Stylesheet", function () {
      let scripts;
      let styles;

      before(async function () {
        scripts = await glob.promise(path.join(outputPath, "public/card.*.js"));
        styles = await glob.promise(path.join(outputPath, `public/card.*.css`));
      });

      it("should have the expected import attribute for importing theme.css as a Constructable Stylesheet in the card.js bundle", function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");

        expect(scripts.length).to.equal(1);
        expect(scriptContents).to.match(
          new RegExp(`import r from"/styles/theme\\.${HASH_8_REGEX}\\.css"with\\{type:"css"\\};`),
        );
      });

      it("should have the expected import attribute for importing card.css as a Constructable Stylesheet in the card.js bundle", function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");

        expect(scripts.length).to.equal(1);
        expect(scriptContents).to.match(
          new RegExp(`import a from"/card\\.${HASH_8_REGEX}\\.css"with\\{type:"css"\\};`),
        );
      });

      it("should have the expected import attribute for importing @spectrum-css/card as a Constructable Stylesheet in the card.js bundle", function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");

        expect(scriptContents).to.contain(
          'const e=new CSSStyleSheet;e.replaceSync(".spectrum-Card{--spectrum-card-background-color',
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
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
