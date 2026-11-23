/*
 * Use Case
 * Run Greenwood build command with an HTML page that has frontmatter followed by
 * body content which itself contains `---` sequences (inline dashes / dividers).
 *
 * User Result
 * Should generate a bare bones Greenwood build where only the leading frontmatter
 * block is removed and no body content is truncated at a later `---`.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import { expect } from "chai";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

// https://github.com/ProjectEvergreen/greenwood/issues/1711
describe("Build Greenwood With: ", function () {
  const LABEL = "Frontmatter With `---` Sequences In The Page Body";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
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

    // only the "public" smoke tests here: the shared "index" suite asserts the body
    // contains no `---`, but this fixture intentionally keeps inline `---` in the body
    runSmokeTest(["public"], LABEL);

    describe("Body content around inline `---` dashes", function () {
      let dom;
      let html;

      before(async function () {
        const htmlUrl = new URL("index.html", this.context.publicDir);

        dom = await JSDOM.fromFile(fileURLToPath(htmlUrl));
        html = await fs.promises.readFile(htmlUrl, "utf-8");
      });

      it("should preserve the leading heading that comes before the inline dashes", function () {
        const headings = dom.window.document.querySelectorAll("body h1");

        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal("Before the dashes");
      });

      it("should preserve the full paragraph text containing the inline `---` dashes", function () {
        const paragraphs = dom.window.document.querySelectorAll("body p");

        expect(paragraphs.length).to.be.equal(1);
        expect(paragraphs[0].textContent).to.be.equal("some --- inline --- dashes");
      });

      it("should preserve the trailing heading that comes after the inline dashes", function () {
        const headings = dom.window.document.querySelectorAll("body h2");

        expect(headings.length).to.be.equal(1);
        expect(headings[0].textContent).to.be.equal("After the dashes");
      });

      it("should strip the leading frontmatter block from the rendered output", function () {
        expect(html).to.not.contain('title: "Dashes Page"');
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
