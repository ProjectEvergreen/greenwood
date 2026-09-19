/*
 * Use Case
 * Run Greenwood build command with a dynamic sitemap module in the workspace.
 *
 * User Result
 * Should generate a sitemap.xml in the output directory from the handler exported
 * by sitemap.xml.js, and bundle the module for on demand usage.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   pages/
 *     about.html
 *     index.html
 *   sitemap.xml.js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Config and a Dynamic Sitemap";
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

    runSmokeTest(["public"]);

    describe("Dynamic sitemap output", function () {
      let sitemap;

      before(async function () {
        sitemap = await fs.readFile(path.join(this.context.publicDir, "sitemap.xml"), "utf-8");
      });

      it("should generate a sitemap.xml file in the output directory", function () {
        expect(sitemap).to.contain('<?xml version="1.0" encoding="UTF-8"?>');
      });

      it("should have a url entry for each page from the graph", function () {
        expect(sitemap).to.contain("<loc>http://www.example.com/</loc>");
        expect(sitemap).to.contain("<loc>http://www.example.com/about/</loc>");
      });

      it("should emit the bundled sitemap module in the output directory", async function () {
        const bundledSitemap = await fs.readFile(
          path.join(this.context.publicDir, "sitemap.xml.route.js"),
          "utf-8",
        );

        expect(bundledSitemap).to.contain("handler");
      });

      it("should track the bundled sitemap module in the manifest", async function () {
        const manifest = JSON.parse(
          await fs.readFile(path.join(this.context.publicDir, "manifest.json"), "utf-8"),
        );

        expect(manifest.sitemap.outputHref.endsWith("sitemap.xml.route.js")).to.equal(true);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
