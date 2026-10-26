/*
 * Use Case
 * Run Greenwood develop command with parsing TSX content.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * import { greenwoodPluginImportJsx } from '@greenwood/plugin-import-jsx';
 *
 * {
 *   prerender: true,
 *   plugins: [{
 *     greenwoodPluginImportJsx()
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     greeting.tsx
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
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

      hostname = await startServer(runner, cliPath, "develop");
      this.context.hostname = hostname;
    });

    runSmokeTest(["serve"], LABEL);

    // extra testing for - https://github.com/ProjectEvergreen/greenwood/issues/1637
    describe("Develop command with transforming TSX files", function () {
      let contents;

      before(async function () {
        const response = await fetch(`${hostname}/components/greeting.tsx`);
        contents = await response.text();
      });

      it("should return the correct content type", function (done) {
        expect(contents.indexOf("this.innerHTML")).to.not.equal(-1);
        done();
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
