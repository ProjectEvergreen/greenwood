/*
 * Use Case
 * Run Greenwood build command for a dynamic route whose getStaticPaths returns a
 * non-ASCII slug, and whose getBody echoes the slug param back into the page.
 *
 * User Result
 * Should generate a static page whose params are decoded (café), not percent-encoded (caf%C3%A9).
 *
 * User Command
 * greenwood build
 *
 * User Config
 * N / A
 *
 * User Workspace
 * src/
 *   pages/
 *     [slug].js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1713
describe("Build Greenwood With: ", function () {
  const LABEL = "Dynamic Route with getStaticPaths returning a non-ASCII (percent-encodable) slug";
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

    describe("A static page generated for a non-ASCII slug", function () {
      let dom;
      let html;

      before(async function () {
        html = await fs.readFile(new URL("./public/café/index.html", import.meta.url), "utf-8");
        dom = new JSDOM(html);
      });

      it("should generate the page at the decoded slug directory", function () {
        expect(html.length).to.be.greaterThan(0);
      });

      it("should render the decoded slug param in the page body, not the percent-encoded value", function () {
        const headings = dom.window.document.querySelectorAll("body > h2");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("café");
      });

      it("should not leak the percent-encoded slug value into the output", function () {
        expect(html).to.not.include("caf%C3%A9");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
