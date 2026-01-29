/*
 * Use Case
 * Run Greenwood develop command with raw plugin and importMapExtensions option.
 *
 * User Result
 * Should start the development server and include import map entries for query param usage for `.svg` extensions.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * import { greenwoodPluginImportRaw } from '@greenwood/plugin-import-raw';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginImportRaw({
 *       importMapExtensions: ['css']
 *     })
 *   }]
 * }
 *
 * User Workspace
 * src/
 *   index.html
 *
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "Import Raw plugin for using ESM with arbitrary files as strings";
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

    describe("Develop command with importMapExtensions", function () {
      let dom;

      before(async function () {
        const response = await fetch(`${hostname}:${port}`);
        const html = await response.text();

        dom = new JSDOM(html);
      });

      it("should have the expected number of CSS entries in the import map", function () {
        const importMapTags = dom.window.document.querySelectorAll(
          'head > script[type="importmap"]',
        );
        const importMapTag = importMapTags[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        const cssEntries = Object.keys(importMap).filter((entry) =>
          new URL(importMap[entry].replace("/~/", "file://")).pathname.endsWith(".css"),
        );

        expect(cssEntries.length).to.equal(166);
      });

      it("should have the expected number of CSS entries with `?type=raw in the import map", function () {
        const importMapTags = dom.window.document.querySelectorAll(
          'head > script[type="importmap"]',
        );
        const importMapTag = importMapTags[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;
        const cssEntries = Object.keys(importMap).filter((entry) =>
          new URL(importMap[entry].replace("/~/", "file://")).pathname.endsWith(".css"),
        );
        const rawCssEntries = cssEntries.filter(
          (entry) => entry.endsWith(".css?type=raw") && importMap[entry].endsWith(".css?type=raw"),
        );

        expect(rawCssEntries.length).to.equal(cssEntries.length / 2);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown([path.join(outputPath, ".greenwood")]);
  });
});
