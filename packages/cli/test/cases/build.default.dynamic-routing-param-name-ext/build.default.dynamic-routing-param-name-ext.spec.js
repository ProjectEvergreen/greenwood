/*
 * Use Case
 * Run Greenwood build command for a dynamic route whose param name contains the
 * file extension as a substring (e.g. [json].js), returning static paths from getStaticPaths.
 *
 * User Result
 * Should statically generate each path with the correct param name / value, emitting
 * /alpha/index.html and /beta/index.html (not a literal /[json]/index.html with garbage params).
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 *  src/
 *   pages/
 *     [json].js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1719
describe("Build Greenwood With: ", function () {
  const LABEL = "A dynamic route whose param name contains the file extension substring";
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

    describe("Static generation for the [json].js dynamic route", function () {
      it("should emit a static path for each set of params returned from getStaticPaths", async function () {
        const files = await Array.fromAsync(
          fs.glob("*/index.html", { cwd: new URL("./public/", import.meta.url) }),
        );

        expect(files.length).to.equal(2);
      });

      it("should NOT emit a literal /[json]/index.html directory", async function () {
        const files = await Array.fromAsync(
          fs.glob("[[]json[]]/index.html", { cwd: new URL("./public/", import.meta.url) }),
        );

        expect(files.length).to.equal(0);
      });

      it("should resolve the params for each static path, not the first one", async function () {
        const themes = { alpha: "Alpha", beta: "Beta" };

        for (const [route, label] of Object.entries(themes)) {
          const html = await fs.readFile(
            path.join(outputPath, `public/${route}/index.html`),
            "utf-8",
          );
          const headings = new JSDOM(html).window.document.querySelectorAll("h1");

          expect(headings.length).to.equal(1);
          expect(headings[0].textContent).to.equal(label);
        }
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
