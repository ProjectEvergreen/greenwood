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
import path from "node:path";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1814
describe("Serve Greenwood With: ", function () {
  const LABEL = "Ordered Resource Plugin Response Merging";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    runner = new Runner(false, true);
  });

  describe(LABEL, function () {
    let response;
    let dom;

    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "serve", {
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
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
