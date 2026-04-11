/*
 * Use Case
 * Run Greenwood build command with JSX based Signals reactivity.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
 *
 * {
 *   prerender: true,
 *   plugins: [{
 *     greenwoodPluginImportJsx({
 *       inferredObservability: true
 *     })
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     counter.jsx
 *   pages/
 *     index.html
 */
import chai from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "JSX based Signals Reactivity and prerendering";
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
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"], LABEL);

    describe("Build command with plugins setup for Signals and effects in the output HTML", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should not contain an import map for Signals polyfill and WCC effect.js", function (done) {
        const importMapTags = dom.window.document.querySelectorAll(
          'head > script[type="importmap"]',
        );

        expect(importMapTags.length).to.equal(0);

        done();
      });

      it("should contain a script tag for exposing Signal globally", function (done) {
        const scriptModuleTags = dom.window.document.querySelectorAll(
          'head > script[type="module"]',
        );
        const contents = scriptModuleTags[0].textContent;

        expect(contents).to.include(`import{S as i}from"/index`);
        expect(contents).to.include("globalThis.Signal=i;");

        done();
      });
    });

    describe("Build command when transforming TSX files that is based on signals", function () {
      let scripts;
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
        scripts = await Array.fromAsync(
          fs.glob("counter.*.js", { cwd: new URL("./public/", import.meta.url) }),
        );
      });

      it("should transform the file with the expected usage of signals", async function () {
        const contents = await fs.readFile(
          new URL(`./public/${scripts[0]}`, import.meta.url),
          "utf-8",
        );

        expect(scripts.length).to.equal(1);
        expect(contents.indexOf("const n=new t.subtle.Watcher(") >= 0).to.equal(true);
      });

      it("should render the expected content in the html", async function () {
        const counter = dom.window.document.querySelectorAll(
          'wcc-counter template[shadowrootmode="open"]',
        );
        const counterContentsDom = new JSDOM(counter[0].innerHTML);
        const countText = counterContentsDom.window.document
          .querySelectorAll("span.even")[0]
          .textContent.trim();
        const isLargeText = counterContentsDom.window.document
          .querySelectorAll("p")[0]
          .textContent.trim();

        expect(countText).to.equal("The count is 0 (even)");
        expect(isLargeText).to.equal("(Keep Going...)");
      });
    });
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, "public"),
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
