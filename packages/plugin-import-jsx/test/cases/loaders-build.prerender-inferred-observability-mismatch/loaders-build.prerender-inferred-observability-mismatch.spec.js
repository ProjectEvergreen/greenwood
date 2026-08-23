/*
 * Use Case
 * Run Greenwood build command with a JSX component that opts into Signals reactivity through the
 * file level `export const inferredObservability` while the plugin is configured without the
 * matching `inferredObservability` option.
 *
 * User Result
 * Should report the mismatch at build time, since the emitted bundle references the Signal global
 * that the plugin only injects when its own option is enabled.
 * https://github.com/ProjectEvergreen/greenwood/issues/1780
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
 *
 * {
 *   prerender: true,
 *   plugins: [
 *     greenwoodPluginImportJsx()
 *   ]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     counter.jsx
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL =
    "JSX based Signals Reactivity opted into per file while the plugin option is not enabled";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;
  let output = "";

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build", {
        onStdOut: (message) => {
          output += message;
        },
      });
    });

    runSmokeTest(["public"], LABEL);

    describe("Build command output for the mismatched inferredObservability configuration", function () {
      it("should report the JSX module that opted into inferred observability", function (done) {
        expect(output).to.contain("src/components/counter.jsx");

        done();
      });
    });

    describe("Build command output for the emitted Signals bundle and page", function () {
      let dom;
      let scripts;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
        scripts = await Array.fromAsync(
          fs.glob("counter.*.js", { cwd: new URL("./public/", import.meta.url) }),
        );
      });

      it("should emit a bundle that reads the Signal global", async function () {
        const contents = await fs.readFile(
          new URL(`./public/${scripts[0]}`, import.meta.url),
          "utf-8",
        );

        expect(scripts.length).to.equal(1);
        expect(contents).to.contain("new Signal.State(");
        expect(contents).to.contain("new Signal.Computed(");
      });

      it("should not contain a script tag for exposing Signal globally", function (done) {
        const scriptModuleTags = Array.from(
          dom.window.document.querySelectorAll('head > script[type="module"]'),
        ).filter((script) => script.textContent.indexOf("globalThis.Signal") >= 0);

        expect(scriptModuleTags.length).to.equal(0);

        done();
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
