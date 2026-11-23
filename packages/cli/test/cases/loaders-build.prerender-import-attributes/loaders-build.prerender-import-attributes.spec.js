/*
 * Use Case
 * Run Greenwood with prerendering of CSS and JSON being referenced using import attributes.
 *
 * User Result
 * Should generate a static Greenwood build with CSS properly prerendered.
 *
 * User Command
 * greenwood build
 *
 * User Config
 *
 * {
 *   prerender: true,
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero/
 *       hero.css
 *       hero.js
 *       hero.json
 *    index.html
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles, HASH_REGEX } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "ESM Import Attribute for CSS and JSON with prerendering";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
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

    runSmokeTest(["public"], LABEL);

    describe("Custom Element Importing CSS w/ Constructable Stylesheet", function () {
      const cssFileHash = "EPod9YqN";
      let scripts;
      let styles;

      before(async function () {
        scripts = await glob.promise(fileURLToPath(new URL("public/hero.*.js", outputUrl)));
        styles = await glob.promise(
          fileURLToPath(new URL(`public/hero.${cssFileHash}.css`, outputUrl)),
        );
      });

      it("should have the expected import attribute for importing hero.css as a Constructable Stylesheet in the hero.js bundle", function () {
        const scriptContents = fs.readFileSync(scripts[0], "utf-8");

        expect(scripts.length).to.equal(1);
        expect(scriptContents).to.match(
          new RegExp(`import t from"/hero\\.${HASH_REGEX}\\.css"with\\{type:"css"\\};`),
        );
      });

      it("should have the expected CSS output bundle for hero.css", function () {
        const styleContents = fs.readFileSync(styles[0], "utf-8");

        expect(styles.length).to.equal(1);
        expect(styleContents).to.contain(":host{text-align:center;margin-bottom:40px;}");
      });
    });

    describe("Importing JSON", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have the expected inline content from the JSON file", function () {
        const hero = new JSDOM(
          dom.window.document.querySelector('app-hero template[shadowrootmode="open"]').innerHTML,
        );
        const heading = hero.window.document.querySelectorAll("div.hero h2");

        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.be.equal("Welcome to my website");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
