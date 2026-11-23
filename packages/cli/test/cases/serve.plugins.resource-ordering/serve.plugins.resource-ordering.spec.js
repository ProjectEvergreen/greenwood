/*
 * Use Case
 * Run Greenwood with multiple resource plugins that intercept an SSR page in sequence.
 *
 * User Result
 * Each plugin should receive an HTML response and its output should be present in the served page.
 *
 * User Command
 * greenwood build && greenwood serve
 *
 * User Config
 * {
 *   plugins: [bodyOnlyResponsePlugin, htmlResponsePlugin]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     index.js
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

// https://github.com/ProjectEvergreen/greenwood/issues/1814
describe("Serve Greenwood With: ", function () {
  const LABEL = "Ordered Resource Plugin Response Merging";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    runner = new Runner({ forwardParentArgs: true });
  });

  describe(LABEL, function () {
    let response;
    let dom;

    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliUrl, {
            args: "serve",
            onStdOut: (message) => {
              if (message.includes("Started server at http://localhost:8080")) {
                resolve();
              }
            },
          })
          .catch(reject);
      });

      response = await fetch(hostname);
      dom = new JSDOM(await response.text());
    });

    it("should return an HTML response", function () {
      expect(response.status).to.equal(200);
      expect(response.headers.get("content-type")).to.equal("text/html");
    });

    it("should include the output from both resource plugins", function () {
      const document = dom.window.document;

      expect(document.querySelector('meta[name="first-plugin"]')?.content).to.equal("complete");
      expect(document.querySelector('meta[name="second-plugin"]')?.content).to.equal("complete");
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
