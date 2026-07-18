/*
 * Use Case
 * Run Greenwood build command with an unsupported direct `import ... from "./add.wasm"`.
 *
 * User Result
 * The build should fail, but NOT with the misleading acorn `SyntaxError` thrown from inside the
 * `greenwood-import-meta-url` Rollup plugin (which pointed users at internal plugin code when the
 * wasm binary was fed to the JavaScript parser). A clear, Rollup-native parse error is acceptable.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 *  src/
 *    pages/
 *      index.html
 *    scripts/
 *      add.wasm
 *      main.js
 */
import { expect } from "chai";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;
  let buildError;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe("An unsupported direct import of a .wasm module", function () {
    before(async function () {
      await runner.setup(outputPath);

      try {
        await runner.runCommand(cliPath, "build");
      } catch (error) {
        buildError = `${error}`;
      }
    });

    it("should fail the build", function () {
      expect(buildError).to.not.equal(undefined);
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1723
    it("should not crash with the acorn SyntaxError from the greenwood-import-meta-url plugin", function () {
      expect(buildError).to.not.contain("greenwood-import-meta-url");
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
