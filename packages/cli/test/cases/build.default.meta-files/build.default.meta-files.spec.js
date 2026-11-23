/*
 * Use Case
 * Run Greenwood build command with no config and a robots.txt.
 *
 * User Result
 * Should generate a bare bones Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   favicon.ico
 *   robots.txt
 *   sitemap.xml
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace with common meta file";
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

    runSmokeTest(["public"], LABEL);

    describe("Default output for project level favicon.ico", function () {
      let favicons;

      before(async function () {
        favicons = await glob(fileURLToPath(new URL("*.ico", this.context.publicDir)));
      });

      it("should have one favicon file in the output directory", function () {
        expect(favicons.length).to.equal(1);
      });
    });

    describe("Default output for project level robots.txt", function () {
      let robots;

      before(async function () {
        robots = await glob(fileURLToPath(new URL("*.txt", this.context.publicDir)));
      });

      it("should have one robots file in the output directory", function () {
        expect(robots.length).to.equal(1);
      });
    });

    describe("Default output for project level sitemap.xml", function () {
      let sitemaps;

      before(async function () {
        sitemaps = await glob(fileURLToPath(new URL("sitemap.xml", this.context.publicDir)));
      });

      it("should have one sitemap.xml file in the output directory", function () {
        expect(sitemaps.length).to.equal(1);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
