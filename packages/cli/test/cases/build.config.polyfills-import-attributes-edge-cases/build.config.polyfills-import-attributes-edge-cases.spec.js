/*
 * Use Case
 * Run Greenwood build command with the import attributes polyfill enabled against JavaScript
 * that exercises the tricky inputs that a naive whole-file string rewrite mangles: a commented-out
 * copy of an import, a binding name containing "with", two imports of the same specifier, a
 * multi-line attributes clause, a specifier repeated inside a string literal, and a dynamic
 * import with a `with` options object.
 *
 * User Result
 * Should generate a bundled build where each edge case survives bundling: CSS and JSON modules
 * are inlined into the hashed bundle exactly once each, string literals come through verbatim,
 * no import attributes syntax is left behind, and the dynamic import points at its own
 * hashed chunk.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * polyfills: {
 *   importAttributes: ['css', 'json']
 * }
 *
 * User Workspace
 * src/
 *   main.js
 *   theme.css
 *   shared.css
 *   dynamic.css
 *   banner.css
 *   data.json
 *   index.html
 * greenwood.config.js
 * package.json
 *
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1721
describe("Build Greenwood With: ", function () {
  const LABEL = "Import Attributes Polyfill Edge Cases Configuration and Bundling";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputUrl = new URL(".", import.meta.url);
  const outputPath = fileURLToPath(outputUrl);
  const mainHash = "CSiWS0jA";
  const dynamicHash = "EnFwlQ5z";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    describe("Bundled output for the tricky JavaScript file (main.js)", function () {
      let contents;
      let stripped;

      before(async function () {
        contents = await fs.readFile(new URL(`./public/main.${mainHash}.js`, outputUrl), "utf-8");
        stripped = contents.replace(/ /g, "");
      });

      it("should leave no import attributes syntax outside the two preserved string literals", function (done) {
        // the only `with { type: ... }` text left is inside the usage / help string literals
        expect(stripped.split("with{type:").length - 1).to.equal(2);
        expect(stripped).to.not.contain("?polyfill=type-");

        done();
      });

      it("should inline the CSS for an import whose binding name contains 'with' exactly once", function (done) {
        expect(contents.split('replaceSync("a{color:blue}")').length - 1).to.equal(1);

        done();
      });

      it("should inline the CSS for a twice-imported specifier exactly once", function (done) {
        expect(contents.split("h1{color:green}").length - 1).to.equal(1);

        done();
      });

      it("should inline the JSON from a multi-line attributes clause", function (done) {
        expect(stripped).to.contain('{msg:"HelloWorld"}');

        done();
      });

      it("should leave the import syntax inside a string literal untouched", function (done) {
        expect(contents).to.contain(
          '\'example: import sheet from "./theme.css" with { type: "css" };\'',
        );

        done();
      });

      it("should not mangle a string literal that duplicates a real import's specifier", function (done) {
        expect(contents).to.contain(
          '\'run: import banner from "./banner.css" with { type: "css" };\'',
        );
        expect(contents).to.contain('replaceSync("button{color:purple}")');

        done();
      });

      it("should rewrite the dynamic import to its own hashed chunk", function (done) {
        expect(contents).to.contain(`import("./dynamic.${dynamicHash}.js")`);

        done();
      });
    });

    describe("Bundled output for the dynamically imported CSS chunk", function () {
      let contents;

      before(async function () {
        contents = await fs.readFile(
          new URL(`./public/dynamic.${dynamicHash}.js`, outputUrl),
          "utf-8",
        );
      });

      it("should export the CSS as a constructable stylesheet", function (done) {
        expect(contents).to.contain('replaceSync("p{color:red}")');
        expect(contents).to.contain("export{");

        done();
      });
    });

    describe("Index page referencing the hashed bundle", function () {
      let dom;

      before(async function () {
        const html = await fs.readFile(new URL("./public/index.html", outputUrl), "utf-8");
        dom = new JSDOM(html);
      });

      it("should reference the hashed main bundle from the script tag", function (done) {
        const scripts = Array.from(dom.window.document.querySelectorAll("script[src]"));

        expect(scripts.length).to.equal(1);
        expect(scripts[0].getAttribute("src")).to.equal(`/main.${mainHash}.js`);

        done();
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
