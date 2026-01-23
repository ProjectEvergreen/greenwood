/*
 * Use Case
 * Run Greenwood build command with a static site and only prerendering the content (no JS!).  Modeled after the
 * Greenwood Getting Started repo.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly layoutd out HTML from a LitElement.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginRendererLit({
 *       prerender: true
 *     })
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   assets/
 *     greenwood-logo.png
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     blog/
 *       first-post.html
 *       second-post.html
 *     index.html
 *   styles/
 *     theme.css
 *   layouts/
 *     app.html
 *     blog.html
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With Custom Lit Renderer for SSG prerendering: ", function () {
  const LABEL = "For SSG prerendering of Getting Started example";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
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

      it("should have the expected lit hydration script in the <head>", function () {
        const scripts = Array.from(dom.window.document.querySelectorAll("head script")).filter(
          (script) =>
            !script.getAttribute("src") &&
            script.textContent?.indexOf("globalThis.litElementHydrateSupport") >= 0,
        );

        expect(scripts.length).to.equal(1);
      });
    });

    describe("LitElement <app-header> statically rendered into index.html", function () {
      let body;

      before(async function () {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));

        body = dom.window.document.querySelector("body");
      });

      it("should have expected <h1> tag content in the <header>", function () {
        const html = body.innerHTML.trim();

        expect(html).to.contain("<header>");
        expect(html).to.contain("This is the header component.");
      });
    });

    describe("LitElement <app-footer> statically rendered into index.html", function () {
      let body;

      before(async function () {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));

        body = dom.window.document.querySelector("body");
      });

      it("should have expected footer <h4> tag content in the <body>", function () {
        const html = body.innerHTML.trim();

        expect(html).to.contain("<footer>");
        expect(html).to.contain("My Blog");
        expect(html).to.contain("2022");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
