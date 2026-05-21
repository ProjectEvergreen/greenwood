/*
 * Use Case
 * Run Greenwood build command with no config bundling an asset with spaces in the filename.
 *
 * User Result
 * Should create a production build of the Greenwood application with bundled assets intact.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * N / A
 *
 * User Workspace
 * src/
 *   assets/
 *     Night_Owl.json
 *   pages/
 *     index.html
 *   scripts/
 *     loaders.js
 *     other loader.js
 *   styles/
 *    my styles.css
 */
import chai from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

// https://github.com/ProjectEvergreen/greenwood/issues/1679
describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace with spaces in filenames";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8181";
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    it("should have the correct filename in the output HTML for a script tag", async function () {
      const files = await Array.fromAsync(
        fs.glob("other*.*.js", { cwd: new URL("./public/", import.meta.url) }),
      );
      const html = await fs.readFile(new URL("./public/index.html", import.meta.url), "utf-8");

      expect(html).to.include(`/${files[0]}`);
    });

    it("should have the correct filename in the output HTML for a style tag", async function () {
      const files = await Array.fromAsync(
        fs.glob("my styles.*.css", { cwd: new URL("./public/styles/", import.meta.url) }),
      );
      const html = await fs.readFile(new URL("./public/index.html", import.meta.url), "utf-8");

      expect(html).to.include(`/${files[0]}`);
    });

    it("should have the correct filename in the bundled output for an import attribute", async function () {
      const files = await Array.fromAsync(
        fs.glob("loader.*.js", { cwd: new URL("./public", import.meta.url) }),
      );

      const contents = await fs.readFile(new URL(`./public/${files[0]}`, import.meta.url), "utf-8");
      const pattern = /Night_20Owl\.[a-zA-Z0-9]+\.json/;

      expect(pattern.test(contents)).to.be.true;
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
