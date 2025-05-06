/*
 * Use Case
 * Run Greenwood with custom markdown preset in greenwood config.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom markdown and rehype links
 *
 * User Command
 * greenwood build
 *
 * User Config
 * plugins: [greenwoodPluginMarkdown({
 *   plugins: [
 *     '@mapbox/rehype-prism',
 *     'rehype-slug',
 *     {
 *       name: "rehype-autolink-headings",
 *       options: { behavior: 'append'}
 *     },
 *   ]
 * })]
 *
 * User Workspace
 * src/
 *   pages/
 *     index.md
 */
import { JSDOM } from "jsdom";
import path from "path";
import chai from "chai";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Markdown Configuration and Default Workspace";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Custom Markdown Plugins", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
      });

      it("should use our custom rehype plugin to add syntax highlighting", function () {
        let pre = dom.window.document.querySelectorAll("body pre");
        let code = dom.window.document.querySelectorAll("body pre code");

        expect(pre.length).to.equal(1);
        expect(pre[0].getAttribute("class")).to.equal("language-js");

        expect(code.length).to.equal(1);
        expect(code[0].getAttribute("class")).to.equal("language-js");
      });

      it("should have the expected heading ID output for the custom rehype-autolink-headings plugin", function () {
        const heading = dom.window.document.querySelector("h1 > a");

        expect(heading.getAttribute("href")).to.equal(
          "#greenwood-markdown-syntax-highlighting-test",
        );
      });

      it("should have the expected append heading link icon behavior for the custom rehype-autolink-headings plugin", function () {
        const heading = dom.window.document.querySelector("h1");

        expect(
          heading.innerHTML.startsWith(
            'Greenwood Markdown Syntax Highlighting Test<a aria-hidden="true"',
          ),
        ).to.equal(true);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
