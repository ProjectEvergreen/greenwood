/*
 * Use Case
 * Run Greenwood build command against a binary asset served by a custom resource plugin,
 * using .wasm for the test case.
 *
 * User Result
 * Should emit a content-hashed, byte-identical binary asset instead of bundling it as JavaScript.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * A resource plugin serving .wasm files with the application/wasm content type.
 *
 * User Workspace
 *  src/
 *    pages/
 *      index.html
 *    scripts/
 *      add.wasm
 *      main.js
 * greenwood.config.js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

// https://github.com/ProjectEvergreen/greenwood/issues/1723
describe("Build Greenwood With: ", function () {
  const LABEL = "Referencing a binary asset";
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

    describe("Binary asset bundling from a plugin", function () {
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

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
