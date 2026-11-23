/*
 * Use Case
 * Run Greenwood build command with no config and this plugin.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly templated out HTML from a custom elements tag.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginIncludeHTML } from '@greenwood/plugin-include-html';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginIncludeHTML()
 *  }]
 *
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     footer.js
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With HTML Include Plugin: ", function () {
  const LABEL = "Using Custom Element feature";
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

    describe("Default custom element include and page content for index.html", function () {
      let dom;
      let footerHeadingTags;
      let headingTags;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
        footerHeadingTags = dom.window.document.querySelectorAll("body footer h4");
        headingTags = dom.window.document.querySelectorAll("body h1");
      });

      it("should have expected footer <h4> tag content in the <body>", function () {
        const text = footerHeadingTags[0].textContent;

        expect(footerHeadingTags.length).to.be.equal(1);
        expect(text.trim()).to.be.equal("Greenwood v1.0.0");
      });

      it("should replace multiline nested includes without consuming sibling elements", function () {
        expect(dom.window.document.querySelector("inner-card")).to.equal(null);
        expect(dom.window.document.querySelector("other-card").textContent).to.equal(
          "keep this sibling",
        );
      });

      it("should have existing <h1> content in the <body>", function () {
        const text = headingTags[0].textContent;

        expect(headingTags.length).to.be.equal(1);
        expect(text).to.be.equal("Hello!");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
