/*
 * Use Case
 * Run Greenwood build command with no config and a stylesheet that references the same
 * asset from more than one url(), e.g. the classic eot ?#iefix @font-face fallback.
 * Each url() fires its own copy of the same source file to the same hashed destination,
 * which intermittently fails on Windows with EBUSY (destination locked by the concurrent
 * copy) and crashes the build as an unhandled rejection.  The Windows locking behavior
 * is emulated deterministically via windows-copyfile-emulation.js, loaded into the CLI
 * process through NODE_OPTIONS --import.
 * https://github.com/ProjectEvergreen/greenwood/issues/1585
 *
 * User Result
 * Should generate a bare bones Greenwood build with the referenced font copied once.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 *  src/
 *   fonts/
 *     example.woff
 *   pages/
 *     index.html
 *   styles/
 *     main.css
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, pathToFileURL } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and duplicate CSS asset references";
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
      const shimUrl = pathToFileURL(path.join(outputPath, "windows-copyfile-emulation.js"));
      const previousNodeOptions = process.env.NODE_OPTIONS;

      process.env.NODE_OPTIONS = `--import=${shimUrl.href}`;

      try {
        await runner.setup(outputPath);
        await runner.runCommand(cliPath, "build");
      } finally {
        if (previousNodeOptions === undefined) {
          delete process.env.NODE_OPTIONS;
        } else {
          process.env.NODE_OPTIONS = previousNodeOptions;
        }
      }
    });

    runSmokeTest(["public"], LABEL);

    describe("Bundled CSS with duplicate references to the same font file", function () {
      let styles;
      let fonts;

      before(async function () {
        styles = await Array.fromAsync(
          fs.glob("main.*.css", { cwd: new URL("./public/styles/", import.meta.url) }),
        );
        fonts = await Array.fromAsync(
          fs.glob("example.*.woff", { cwd: new URL("./public/fonts/", import.meta.url) }),
        );
      });

      it("should reference the hashed font file from the bundled stylesheet", async function () {
        const stylesContents = await fs.readFile(
          new URL(`./public/styles/${styles[0]}`, import.meta.url),
          "utf-8",
        );

        expect(stylesContents).to.contain(`/fonts/${fonts[0]}`);
      });

      it("should copy the referenced font file once with its original contents", async function () {
        const sourceContents = await fs.readFile(
          new URL("./src/fonts/example.woff", import.meta.url),
          "utf-8",
        );
        const copiedContents = await fs.readFile(
          new URL(`./public/fonts/${fonts[0]}`, import.meta.url),
          "utf-8",
        );

        expect(fonts.length).to.equal(1);
        expect(copiedContents).to.equal(sourceContents);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
