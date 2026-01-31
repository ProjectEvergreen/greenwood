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
import chai from "chai";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1984;
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes(`Started local development server at http://localhost:1984`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    runSmokeTest(["serve"], LABEL);

    // extra testing for - https://github.com/ProjectEvergreen/greenwood/issues/1637
    describe("Develop command with transforming TSX files", function () {
      let contents;

      before(async function () {
        const response = await fetch(`http://127.0.0.1:${port}/components/greeting.tsx`);
        contents = await response.text();
      });

      it("should return the correct content type", function (done) {
        expect(contents.indexOf("this.innerHTML")).to.not.equal(-1);
        done();
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
