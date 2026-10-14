/*
 * Use Case
 * Run Greenwood develop command with a dependency whose package.json exports a subpath
 * pattern with an array ("fallback") target, e.g. "./*": [{ "import": "./src/*.js" }],
 * followed by another perfectly valid dependency.
 *
 * User Result
 * Should generate an import map covering both dependencies, instead of crashing the
 * walk on the array target and silently dropping every dependency after it.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 *  src/
 *   pages/
 *     index.html
 * package.json (fake-array-pattern-exports, fake-subsequent-dependency)
 *
 * The two fake packages live in ./fixtures and are staged into the monorepo's own
 * node_modules for the duration of the suite, since the import map walker resolves
 * dependencies with import.meta.resolve from the CLI's location, not the project's.
 */
import { expect } from "chai";
import fs from "node:fs";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const fakePackages = ["fake-array-pattern-exports", "fake-subsequent-dependency"];

// https://github.com/ProjectEvergreen/greenwood/issues/1758
describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and a dependency with array pattern exports";
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
      for (const fakePackage of fakePackages) {
        fs.cpSync(
          path.join(outputPath, "fixtures", fakePackage),
          path.join(process.cwd(), "node_modules", fakePackage),
          { recursive: true },
        );
      }

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

    describe("Import map generation with an array pattern exports dependency", function () {
      let importMap;

      before(async function () {
        const response = await fetch(`${hostname}:${port}/`, {
          headers: {
            accept: "text/html",
          },
        });
        const dom = new JSDOM(await response.text());
        const importMapTag = dom.window.document.querySelector('head > script[type="importmap"]');

        importMap = JSON.parse(importMapTag.textContent).imports;
      });

      it("should have an import map entry for the array pattern exports package itself", function () {
        expect(importMap["fake-array-pattern-exports"]).to.not.equal(undefined);
      });

      it("should have an import map entry for the subpath resolved from the array pattern target", function () {
        const subpathKeys = Object.keys(importMap).filter((key) =>
          key.startsWith("fake-array-pattern-exports/"),
        );

        expect(subpathKeys.length).to.be.greaterThan(0);
      });

      it("should still have an import map entry for the dependency listed after the array pattern exports package", function () {
        expect(importMap["fake-subsequent-dependency"]).to.not.equal(undefined);
      });
    });
  });

  after(async function () {
    for (const fakePackage of fakePackages) {
      fs.rmSync(path.join(process.cwd(), "node_modules", fakePackage), {
        recursive: true,
        force: true,
      });
    }

    await runner.teardown([path.join(outputPath, ".greenwood")]);
    await runner.stopCommand();
  });
});
