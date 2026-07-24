/*
 * Use Case
 * Run Greenwood build command with a dynamic sitemap module (src/sitemap.xml.js) and no static
 * sitemap.xml file in the workspace.
 *
 * User Result
 * Should generate a Greenwood build with a sitemap.xml in the output directory, generated from
 * the generateSitemap export of the user's sitemap.xml.js module.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * (default)
 *
 * User Workspace
 * src/
 *   pages/
 *     about.html
 *     index.html
 *   sitemap.xml.js
 */

// https://github.com/ProjectEvergreen/greenwood/issues/1232
import fs from "node:fs/promises";
import { expect } from "chai";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace with a dynamic sitemap module";
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

    describe("Dynamic sitemap.xml output", function () {
      let sitemap;

      before(async function () {
        sitemap = await fs.readFile(path.resolve(this.context.publicDir, "./sitemap.xml"), "utf-8");
      });

      it("should generate a well formed sitemap document", function () {
        expect(sitemap).to.contain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(sitemap).to.contain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        expect(sitemap).to.contain("</urlset>");
      });

      it("should have a url entry for each page in the graph", function () {
        expect(sitemap).to.contain("<loc>http://www.example.com/</loc>");
        expect(sitemap).to.contain("<loc>http://www.example.com/about/</loc>");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
