/*
 * Use Case
 * Run Greenwood develop command with a dynamic sitemap module (src/sitemap.xml.js) in the
 * workspace.
 *
 * User Result
 * Should start the development server and serve /sitemap.xml generated from the generateSitemap
 * export of the user's sitemap.xml.js module.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * (default)
 *
 * User Workspace
 * src/
 *   pages/
 *     about.html
 *     index.html
 *   sitemap.xml.js
 */

// https://github.com/ProjectEvergreen/greenwood/issues/1232
import { expect } from "chai";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace with a dynamic sitemap module";
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
              if (
                message.includes(`Started local development server at http://localhost:${port}`)
              ) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Serve request for the dynamic sitemap.xml", function () {
      let response;
      let body;

      before(async function () {
        response = await fetch(`${this.context.hostname}/sitemap.xml`);
        body = await response.text();
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("Content-Type")).to.equal("text/xml");
      });

      it("should return a well formed sitemap document", function () {
        expect(body).to.contain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(body).to.contain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
        expect(body).to.contain("</urlset>");
      });

      it("should have a url entry for each page in the graph", function () {
        expect(body).to.contain("<loc>http://www.example.com/</loc>");
        expect(body).to.contain("<loc>http://www.example.com/about/</loc>");
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
