/*
 * Use Case
 * Run Greenwood with a dynamic page written in TypeScript.
 *
 * User Result
 * Should generate a Greenwood build that correctly builds and bundles all assets.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   prerender: true,
 *   plugins: [
 *      greenwoodPluginTypeScript()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     greeting.ts
 *   pages/
 *     index.html
 *     about.ts
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

xdescribe("Build Greenwood With: ", function () {
  const LABEL = "Custom TypeScript Plugin and Default Workspace serving a page";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner({ forwardParentArgs: true });
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputUrl);
      runner.runCommand(cliUrl, { args: "build" });
    });

    describe("Home Page", function () {
      let homePage;

      before(async function () {
        homePage = await glob.promise(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have expected text from from index.html in the script output file", function () {
        const contents = fs.readFileSync(homePage[0], "utf-8");

        expect(contents).to.contain("My TS Website");
      });
    });

    describe("Custom Format Dynamic About Page", function () {
      let aboutPage;

      before(async function () {
        aboutPage = await glob.promise(
          fileURLToPath(new URL("*about/index.html", this.context.publicDir)),
        );
      });

      it("should have the expected page HTML file in the output directory", function () {
        expect(aboutPage).to.have.lengthOf(1);
      });

      it("should have expected text from about.ts in the page output", function () {
        const contents = fs.readFileSync(aboutPage[0], "utf-8");

        expect(contents).to.contain("Welcome to our About page!");
      });

      it("should have expected text from greeting.ts in the page output", function () {
        const contents = fs.readFileSync(aboutPage[0], "utf-8");

        expect(contents).to.contain("<h3>Hello About Page!</h3>");
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
