/*
 * Use Case
 * Run Greenwood build command with no config and testing static asset bundling with new URL and import.meta.url.
 *
 * User Result
 * Should generate a bare bones Greenwood build with all the proper static asset bundling.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 *  src/
 *    assets/
 *     blog-images/
 *       wcc-logo.png
 *     greenwood-logo.png
 *     nodejs.svg
 *   components/
 *     header.js
 *   pages/
 *     index.html
 */
import chai from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and static asset bundling";
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
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public"], LABEL);

    describe("Default output for static asset bundling for header.js", function () {
      let headerContents;

      before(async function () {
        const headerScripts = await Array.fromAsync(
          fs.glob("header.*.js", { cwd: new URL("./public/", import.meta.url) }),
        );

        headerContents = await fs.readFile(
          new URL(`./public/${headerScripts[0]}`, import.meta.url),
          "utf-8",
        );
      });

      it("should have the expected bundle path for the first static asset", function () {
        const bundleName = "greenwood-logo.DiicYFep.png";

        expect(headerContents).to.contain(bundleName);
      });

      it("should have the expected bundle path for the second static asset", function () {
        const bundleName = "nodejs.aX7vmD85.svg";

        expect(headerContents).to.contain(bundleName);
      });
    });

    describe("Default file output for auto copied assets directory", function () {
      let assets;

      before(async function () {
        assets = (
          await Array.fromAsync(
            fs.glob("**", { cwd: new URL("./public/assets/", import.meta.url) }),
          )
        ).filter((assets) => assets.indexOf(".") > 0);
      });

      it("should have the expected number of copied static assets", function () {
        expect(assets.length).to.equal(3);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
