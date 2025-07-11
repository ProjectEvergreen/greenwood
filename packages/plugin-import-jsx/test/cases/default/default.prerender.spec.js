/*
 * Use Case
 * Run Greenwood with greenwoodPluginImportJsx plugin with bundling of JSX for the client side using wc-compiler.
 *
 * User Result
 * Should generate a static Greenwood build with JSX properly bundled.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginImportJsx()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   components/
 *     footer.jsx
 *   pages/
 *     index.md
 *   layouts/
 *     app.html
 */
import chai from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("(Experimental) Build Greenwood With: ", function () {
  const LABEL = "Import JSX Plugin for client side bundling";
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
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"], LABEL);

    describe("bundling JSX using ESM (import)", function () {
      let dom;
      let scripts;

      before(async function () {
        scripts = await glob.promise(path.join(this.context.publicDir, "*.js"));
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should contain one bundled output file in the output directory", function () {
        expect(scripts.length).to.be.equal(1);
      });

      it("should have the expected <script> tag in the <head> for the <app-footer> component", function () {
        const scripts = Array.from(dom.window.document.querySelectorAll("head > script")).filter(
          (tag) => !tag.getAttribute("data-gwd"),
        );

        expect(scripts.length).to.equal(1);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
