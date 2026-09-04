/*
 * Use Case
 * Run Greenwood develop command with a dynamic sitemap module in the workspace.
 *
 * User Result
 * Should serve /sitemap.xml from the handler exported by sitemap.xml.js.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   pages/
 *     about.html
 *     index.html
 *   sitemap.xml.js
 */
import { expect } from "chai";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Config and a Dynamic Sitemap";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:1984";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
      hostname,
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
              if (message.includes(`Started local development server at ${hostname}`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Serving the dynamic sitemap", function () {
      let response;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/sitemap.xml`);
        body = await response.clone().text();
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return an XML content type", function () {
        expect(response.headers.get("content-type")).to.contain("text/xml");
      });

      it("should have a url entry for each page from the graph", function () {
        expect(body).to.contain("<loc>http://www.example.com/</loc>");
        expect(body).to.contain("<loc>http://www.example.com/about/</loc>");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
