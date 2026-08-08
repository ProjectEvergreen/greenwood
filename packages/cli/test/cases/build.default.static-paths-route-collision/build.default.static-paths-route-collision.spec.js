/*
 * Use Case
 * Run Greenwood build command for a dynamic route whose getStaticPaths returns a value that
 * resolves to the same route as an existing static page.
 *
 * User Result
 * Should warn about the colliding route, generate the existing page's output only once, and
 * still generate the dynamic route's other static paths.
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
 *     about.html
 *     index.html
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1768
describe("Build Greenwood With: ", function () {
  const LABEL = "A getStaticPaths value that collides with an existing static page";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;
  let stdout = "";
  let stderr = "";

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      // gallinago only surfaces stderr when a command exits non-zero, so observe it directly
      const command = runner.runCommand(cliPath, "build", {
        onStdOut: (message) => {
          stdout += message;
        },
      });

      runner.childProcess.stderr.on("data", (data) => {
        stderr += data.toString("utf-8");
      });

      await command;
    });

    it("should warn about the colliding route, naming both pages", function () {
      expect(stderr).to.contain("Duplicate route detected: the static path /about/");
      expect(stderr).to.contain("pages/[slug].js");
      expect(stderr).to.contain("pages/about.html");
    });

    it("should not generate the colliding static path", function () {
      expect(stdout).to.not.contain("generated static path... /about/");
    });

    it("should generate the colliding route from the static page", async function () {
      const html = await fs.readFile(
        new URL("./public/about/index.html", import.meta.url),
        "utf-8",
      );
      const dom = new JSDOM(html);
      const headings = dom.window.document.querySelectorAll("body > h1");

      expect(headings.length).to.equal(1);
      expect(headings[0].textContent).to.equal("Static About Page");
    });

    it("should still generate the static paths that do not collide", async function () {
      const html = await fs.readFile(
        new URL("./public/contact/index.html", import.meta.url),
        "utf-8",
      );
      const dom = new JSDOM(html);
      const headings = dom.window.document.querySelectorAll("body > h1");
      const paragraphs = dom.window.document.querySelectorAll("body > p");

      expect(headings.length).to.equal(1);
      expect(headings[0].textContent).to.equal("Dynamic Page");
      expect(paragraphs.length).to.equal(1);
      expect(paragraphs[0].textContent).to.equal("contact");
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
