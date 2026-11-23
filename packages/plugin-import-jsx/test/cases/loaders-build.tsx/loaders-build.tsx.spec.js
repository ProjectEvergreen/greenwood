/*
 * Use Case
 * Run Greenwood with greenwoodPluginImportJsx plugin with prerendering of JSX and TSX on the server side using wc-compiler.
 *
 * User Result
 * Should generate a static Greenwood build with JSX properly prerendered.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
 *
 * {
 *   prerender: true,
 *   plugins: [{
 *     greenwoodPluginImportJsx()
 *   }]
 * }
 *
 * User Workspace
 * package.json
 * src/
 *   components/
 *     footer.tsx
 *   pages/
 *     index.html
 *     blog.tsx
 *   layouts/
 *     app.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Import JSX Plugin with static pre-rendering";
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

    runSmokeTest(["public"], LABEL);

    describe("importing TSX using ESM (import)", function () {
      let dom;
      let scripts;

      before(async function () {
        scripts = await glob.promise(fileURLToPath(new URL("*.js", this.context.publicDir)));
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should contain one bundled output file in the output directory for the greeting component", function () {
        expect(scripts.length).to.be.equal(1);
      });

      it("should have the expected content from importing values from package.json in index.html", function () {
        const headings = dom.window.document.querySelectorAll("app-footer footer h4");
        const year = new Date().getFullYear();

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent.trim()).to.equal(`My Blog - ${year}`);
      });

      it("should have no <style> tags in the <head>", function () {
        const links = dom.window.document.querySelectorAll('head link[rel="stylesheet"]');

        expect(links.length).to.equal(0);
      });

      it("should have one <script> tag in the <head> for the greeting frontmatter import", function () {
        const scripts = dom.window.document.querySelectorAll('head script[type="module"]');
        const greetingScripts = Array.from(scripts).filter((script) =>
          script.src
            .replace("file://", "")
            .replace(/\/[A-Z]:/, "")
            .startsWith("/greeting"),
        );

        expect(greetingScripts.length).to.equal(1);
      });
    });

    describe("An SSR page using TSX", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("blog/index.html", this.context.publicDir)),
        );
      });

      it("should have the expected content rendered from JSX", function () {
        const headings = dom.window.document.querySelectorAll("body h2");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent.trim()).to.equal("First Post Page");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
