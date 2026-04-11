/*
 * Use Case
 * Run Greenwood develop command with JSX based Signals reactivity.
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
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "JSX based Signals Reactivity";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1984;
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes(`Started local development server at http://localhost:1984`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    runSmokeTest(["serve"], LABEL);

    describe("Develop command with plugins setup for Signals and effects in the output HTML", function () {
      let dom;

      before(async function () {
        const response = await fetch(`http://127.0.0.1:${port}/`);
        const html = await response.text();

        dom = new JSDOM(html);
      });

      it("should contain an import map for Signals polyfill and WCC effect.js", function (done) {
        const importMapTags = dom.window.document.querySelectorAll(
          'head > script[type="importmap"]',
        );
        const importMapTag = importMapTags[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        expect(importMap["signal-polyfill"]).to.equal(
          "/node_modules/signal-polyfill/dist/index.js",
        );
        expect(importMap["wc-compiler/effect"]).to.equal("/node_modules/wc-compiler/src/effect.js");

        done();
      });

      it("should contain a script tag for exposing Signal globally", function (done) {
        const scriptModuleTags = dom.window.document.querySelectorAll(
          'head > script[type="module"]',
        );
        const contents = scriptModuleTags[0].textContent;

        expect(contents).to.include("import { Signal } from 'signal-polyfill';");
        expect(contents).to.include("globalThis.Signal = Signal;");

        done();
      });
    });

    describe("Develop command with transforming TSX files that is based on signals", function () {
      let contents;

      before(async function () {
        const response = await fetch(`http://127.0.0.1:${port}/components/counter.jsx`);
        contents = await response.text();
      });

      it("should transform the file with the expected usage of signals", function (done) {
        expect(contents.startsWith("import {effect} from 'wc-compiler/effect';")).to.equal(true);
        done();
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
