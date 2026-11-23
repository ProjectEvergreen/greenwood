/*
 * Use Case
 * Run Greenwood with TypeScript processing merging user and default tsconfig.json options.
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's JavaScript files processed based on their own tsconfig.json file merged with the plugin default config.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const pluginTypeScript = require('@greenwood/plugin-typescript');
 *
 * {
 *   plugins: [
 *     ...pluginTypeScript({
 *        extendConfig: true
 *     })
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.ts
 *
 * User tsconfig.json (example)
 * {
 *   "compilerOptions": {
 *     "experimentalDecorators": true,
 *     "noImplicitAny": true,
 *     "strict": true
 *   }
 * };
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

xdescribe("Build Greenwood With: ", function () {
  const LABEL = "Custom TypeScript Options for extending Default Configuration";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    let jsFiles;

    before(function () {
      runner.setup(outputUrl);
      runner.runCommand(cliUrl, { args: "build" });

      jsFiles = glob.sync(fileURLToPath(new URL("*.js", this.context.publicDir)));
    });

    runSmokeTest(["public", "index"], LABEL);

    it("should output one JavaScript file", function () {
      expect(jsFiles.length).to.equal(1);
    });

    describe("TypeScript should process JavaScript that references decorators", function () {
      it("should output correctly processed JavaScript without decorators", function () {
        const notExpectedJavaScript = "@customElement('app-greeting')";
        const javascript = fs.readFileSync(jsFiles[0], "utf-8");

        expect(javascript).to.not.contain(notExpectedJavaScript);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
