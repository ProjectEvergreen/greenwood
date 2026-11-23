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
 *     'my-markdown-project/my-custom-rehype-plugin',
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
 * package.json (exports the project's ESM rehype plugin)
 * my-custom-rehype-plugin.js
 * src/
 *   pages/
 *     index.md
 */
import { JSDOM } from "jsdom";
import { expect } from "chai";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Markdown Configuration and Default Workspace";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Custom Markdown Plugins", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
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

      it("should resolve a project-owned extension through its ESM export", function () {
        const heading = dom.window.document.querySelector("h1");

        expect(heading.getAttribute("data-project-plugin")).to.equal(
          "my-custom-rehype-plugin resolved!",
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

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
