/*
 * Use Case
 * Run Greenwood build command with a dynamic sitemap module written in TypeScript.
 *
 * User Result
 * Should generate a sitemap.xml in the output directory from the handler exported
 * by sitemap.xml.ts.
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
 *     index.html
 *   sitemap.xml.ts
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Config and a Dynamic Sitemap in TypeScript";
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

    describe("Dynamic sitemap output from TypeScript", function () {
      let sitemap;

      before(async function () {
        sitemap = await fs.readFile(path.join(this.context.publicDir, "sitemap.xml"), "utf-8");
      });

      it("should generate a sitemap.xml file in the output directory", function () {
        expect(sitemap).to.contain('<?xml version="1.0" encoding="UTF-8"?>');
      });

      it("should have a url entry for each page from the graph", function () {
        expect(sitemap).to.contain("<loc>http://www.example.com/</loc>");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
