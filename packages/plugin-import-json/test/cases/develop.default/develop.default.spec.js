/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and return JSON file as ESM.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * const { greenwoodPluginImportJson } from '@greenwood/plugin-import-json';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginImportJson()
 *   }]
 * }
 *
 *
 * User Workspace
 * src/
 *   main.json
 *
 */
import { expect } from "chai";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

xdescribe("Develop Greenwood With: ", function () {
  const LABEL = "Import JSON plugin for using ESM with .json files";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
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
      runner.setup(outputUrl);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliUrl, { args: "develop" });
      });
    });

    runSmokeTest(["serve"], LABEL);

    describe("Develop command specific ESM .json behaviors", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}:${port}/main.json?type=json`);
        data = await response.text();
      });

      it("should return a 200", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("text/javascript");
      });

      it("should return an ECMAScript module", function () {
        expect(data).to.equal('export default {"status":200,"message":"got json"}');
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown([new URL(".greenwood", outputUrl)]);
  });
});
