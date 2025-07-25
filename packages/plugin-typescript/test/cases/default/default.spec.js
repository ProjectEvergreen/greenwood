/*
 * Use Case
 * Run Greenwood with TypeScript processing.
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's JavaScript files processed based on the pluygins default config.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const pluginTypeScript = require('@greenwood/plugin-typescript);
 *
 * {
 *   plugins: [
 *     ...pluginTypeScript()
 *  ]
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.ts
 *
 * Default Config
 * {
 *   "compilerOptions": {
 *      "target": "es2020",
 *      "module": "es2020",
 *      "moduleResolution": "node",
 *      "sourceMap": true
 *   }
 * }
 *
 */
import chai from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

xdescribe("Build Greenwood With: ", function () {
  const LABEL = "Default TypeScript configuration";
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
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("TypeScript should process JavaScript that uses an interface", function () {
      it("should output correctly processed JavaScript without the interface", function () {
        const jsFiles = glob.sync(path.join(this.context.publicDir, "*.js"));
        const javascript = fs.readFileSync(jsFiles[0], "utf-8");

        expect(jsFiles.length).to.equal(1);
        expect(javascript.replace(/\n/g, "")).to.contain(
          'const o="Angela",l="Davis",s="Professor";console.log(`Hello ${s} ${o} ${l}!`);',
        );
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
