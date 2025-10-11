/*
 * Use Case
 * Run Greenwood build command with a static site and only prerendering the content (no JS!) and using import attributes
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly templated out HTML from a LitElement.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';
 *
 * {
 *   prerender: true
 *   plugins: [
 *     greenwoodPluginRendererLit()
 *   ]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     header/
 *       header.js
 *       header.css
 *       nav.json
 *   pages/
 *     index.html
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

// TODO we should really try and figure out how we can re-enable this test case
// https://github.com/ProjectEvergreen/greenwood/issues/1463
xdescribe("Build Greenwood With Custom Lit Renderer for SSG prerendering: ", function () {
  const LABEL = "For SSG prerendering with Import Attributes";
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

    runSmokeTest(["public", "index"], LABEL);

    describe('<head> of the page with data-gwd-opt="static" script tags removed', function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should have no script tags in the <body>", function () {
        const scripTags = dom.window.document.querySelectorAll("body script");

        expect(scripTags.length).to.be.equal(0);
      });
    });

    describe("LitElement <app-header> statically rendered into index.html", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should have expected header <nav> content in the <body>", function () {
        const wrapper = new JSDOM(
          dom.window.document.querySelectorAll(
            'app-header template[shadowrootmode="open"]',
          )[0].innerHTML,
        );
        const nav = wrapper.window.document.querySelectorAll("header nav ul li");

        expect(nav.length).to.equal(2);
        expect(nav[0].textContent).to.equal("Home");
        expect(nav[1].textContent).to.equal("About");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
