/*
 * Use Case
 * Run Greenwood build command with custom copy plugins that copy nested directories and files.
 * Cover overlapping directory and file copies across plugins and within one plugin, as well as
 * two file copies from one plugin targeting the same destination.
 *
 * User Result
 * Should copy the Prism theme directory into the output and preserve its files when merging.
 * The last registered copy should win for shared destinations, with the complete contents of
 * duplicate-destination.css replacing prism.min.css.
 * https://github.com/ProjectEvergreen/greenwood/issues/1764
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [
 *     // custom copy plugins; see greenwood.config.js for the complete implementation
 *   ]
 * }
 *
 * User Workspace
 * duplicate-destination.css
 */
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "A Custom Copy Plugin";
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
      await runner.runCommand(cliPath, { args: "build" });
    });

    runSmokeTest(["public"], LABEL);

    describe("Copy Directory", function () {
      it("should create the expected output folder for prism.css assets", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "node_modules/prismjs/themes"))).to
          .be.true;
      });

      it("should contain files from the asset directory", async function () {
        expect(
          await glob.promise(
            path.join(this.context.publicDir, "node_modules/prismjs/themes/*.css"),
          ),
        ).to.have.lengthOf(16);
      });
    });

    describe("Copy Duplicate Destinations", function () {
      const expected = fs.readFileSync(
        new URL("./duplicate-destination.css", import.meta.url),
        "utf-8",
      );

      it("should copy the whole themes directory into each shared destination", async function () {
        for (const sharedDir of [
          "duplicate-destination-plugins",
          "duplicate-destination-locations",
        ]) {
          expect(
            await glob.promise(path.join(this.context.publicDir, sharedDir, "*.css")),
          ).to.have.lengthOf(16);
        }
      });

      it("should let the last of two plugins sharing a destination win", function () {
        const contents = fs.readFileSync(
          path.join(this.context.publicDir, "duplicate-destination-plugins/prism.min.css"),
          "utf-8",
        );

        expect(contents).to.equal(expected);
      });

      it("should let the last of two locations from one plugin sharing a destination win", function () {
        const contents = fs.readFileSync(
          path.join(this.context.publicDir, "duplicate-destination-locations/prism.min.css"),
          "utf-8",
        );

        expect(contents).to.equal(expected);
      });

      it("should let the last file copy to the same destination win", function () {
        const contents = fs.readFileSync(
          path.join(this.context.publicDir, "duplicate-destination-files.css"),
          "utf-8",
        );

        expect(contents).to.equal(expected);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
