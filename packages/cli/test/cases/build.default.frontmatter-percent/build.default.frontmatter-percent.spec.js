/*
 * Use Case
 * Run Greenwood build with a page whose frontmatter title/label contain a literal
 * "%" that is not part of a valid percent-encoding sequence (e.g. "100% Complete").
 *
 * User Result
 * Should generate a bare bones Greenwood build without crashing, with the "%"
 * containing title reaching the output verbatim.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   layouts/
 *     page.html
 *   pages/
 *     index.html   (frontmatter: title "100% Complete", label "Save 20%")
 */
// https://github.com/ProjectEvergreen/greenwood/issues/1709
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { expect } from "chai";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Frontmatter title and label containing a literal percent sign";
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

    describe("Percent-containing Frontmatter Title", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      it("should output an index.html file", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "./index.html"))).to.be.true;
      });

      it("should keep the literal '%' in the frontmatter <title> verbatim", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("100% Complete");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
