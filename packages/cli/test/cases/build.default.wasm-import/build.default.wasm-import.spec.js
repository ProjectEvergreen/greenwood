/*
 * Use Case
 * Run Greenwood build command with .wasm modules, covering both the supported
 * `new URL("./add.wasm", import.meta.url)` pattern and an unsupported direct
 * `import ... from "./add.wasm"`.
 *
 * User Result
 * For the supported pattern, should generate a Greenwood build that emits the .wasm as a
 * content-hashed, byte-identical asset, without crashing the JavaScript parser on the binary.
 * For the unsupported direct import, the build should fail, but NOT with the misleading acorn
 * `SyntaxError` thrown from inside the `greenwood-import-meta-url` Rollup plugin (which pointed
 * users at internal plugin code when the wasm binary was fed to the JavaScript parser). A clear,
 * Rollup-native parse error is acceptable.
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
import fs from "node:fs/promises";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1723
describe("Build Greenwood With: ", function () {
  const LABEL = "Referencing a .wasm asset with new URL and import.meta.url";
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

    runSmokeTest(["public"], LABEL);

    describe("WASM asset output", function () {
      let wasmFiles;

      before(async function () {
        wasmFiles = await Array.fromAsync(
          fs.glob("add.*.wasm", { cwd: new URL("./public/", import.meta.url) }),
        );
      });

      it("should emit exactly one content-hashed .wasm asset", function () {
        expect(wasmFiles.length).to.equal(1);
      });

      it("should emit the .wasm asset byte-identical to the source", async function () {
        const emitted = await fs.readFile(new URL(`./public/${wasmFiles[0]}`, import.meta.url));
        const source = await fs.readFile(new URL("./src/scripts/add.wasm", import.meta.url));

        expect(emitted.equals(source)).to.equal(true);
      });

      it("should reference the content-hashed .wasm filename from the bundled script", async function () {
        const scripts = await Array.fromAsync(
          fs.glob("main.*.js", { cwd: new URL("./public/", import.meta.url) }),
        );
        const contents = await fs.readFile(
          new URL(`./public/${scripts[0]}`, import.meta.url),
          "utf-8",
        );

        expect(contents).to.contain(wasmFiles[0]);
      });
    });
  });

  describe("An unsupported direct import of a .wasm module", function () {
    const mainScriptUrl = new URL("./src/scripts/main.js", import.meta.url);
    let originalMainScript;
    let buildError;

    before(async function () {
      originalMainScript = await fs.readFile(mainScriptUrl, "utf-8");
      await fs.writeFile(
        mainScriptUrl,
        [
          'import * as wasm from "./add.wasm";',
          "",
          'document.getElementById("out").textContent = `add(2,3)=${wasm.add(2, 3)}`;',
          "",
        ].join("\n"),
      );
      await runner.setup(outputPath);

      try {
        await runner.runCommand(cliPath, "build");
      } catch (error) {
        buildError = `${error}`;
      }
    });

    // restore the workspace fixture no matter how the build run above ends
    after(async function () {
      await fs.writeFile(mainScriptUrl, originalMainScript);
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
