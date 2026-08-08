/*
 * Use Case
 * Run Greenwood with activeContent configuration enabled for validating active frontmatter
 * values that contain regex replacement patterns ($&, $`, $1).
 *
 * User Result
 * Should generate a bare bones Greenwood build with frontmatter values interpolated verbatim,
 * with no replacement pattern expansion or page duplication.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   activeContent: true
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     index.html
 */
// https://github.com/ProjectEvergreen/greenwood/issues/1743
import { JSDOM } from "jsdom";
import path from "node:path";
import fs from "node:fs/promises";
import { expect } from "chai";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Active Frontmatter with Dollar Sign Replacement Patterns";
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

    describe("Frontmatter values containing replacement patterns for the home page", function () {
      let dom;
      let html;

      before(async function () {
        const htmlPath = path.resolve(this.context.publicDir, "./index.html");

        dom = await JSDOM.fromFile(htmlPath);
        html = await fs.readFile(htmlPath, "utf-8");
      });

      it("should interpolate a custom data frontmatter value with $&, $` and $1 verbatim", function () {
        const money = dom.window.document.querySelector("body p.money").textContent;

        expect(money).to.be.equal("pay $& now $` later and $1 tomorrow");
      });

      it("should interpolate an active frontmatter title value with $& verbatim in the <head>", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("costs $& per month");
      });

      it("should interpolate an active frontmatter title value with $& verbatim in the <body>", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("costs $& per month");
      });

      it("should not duplicate the page inside itself", function () {
        const headings = dom.window.document.querySelectorAll("h1");

        expect(headings.length).to.be.equal(1);
        expect(html.match(/<p class="money">/g).length).to.be.equal(1);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
