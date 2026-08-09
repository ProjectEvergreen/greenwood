/*
 * Use Case
 * Run Greenwood develop command with both a static sitemap.xml and a dynamic sitemap
 * module in the workspace.
 *
 * User Result
 * Should serve /sitemap.xml from the static sitemap.xml, taking precedence over the
 * dynamic sitemap module.
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
 *     index.html
 *   sitemap.xml
 *   sitemap.xml.js
 */
import { expect } from "chai";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Config and both a Static and Dynamic Sitemap";
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

    describe("Serving the static sitemap with precedence", function () {
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

      it("should serve the static sitemap contents", function () {
        expect(body).to.contain("<loc>http://www.example.com/static/</loc>");
      });

      it("should not serve the dynamic sitemap contents", function () {
        expect(body).to.not.contain("<loc>http://www.example.com/dynamic/</loc>");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
