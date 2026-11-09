/*
 * Use Case
 * Run Greenwood develop command with import maps polyfill flag enabled.
 *
 * User Result
 * Should start the development server and have all the expected import map shim behaviors,
 * including JSON imports with attributes through project aliases alongside dependency mappings
 * and authored overrides.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * devServer: {
 *   polyfill: {
 *     importMaps: true
 *   }
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero.js
 *   data/
 *     title.json
 *   index.html
 * greenwood.config.js
 * package.json
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Import Maps Polyfill Configuration";
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
          .runCommand(cliPath, {
            args: "develop",
            onStdOut: (message) => {
              if (message.includes(`Started local development server at http://localhost:1984`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Import Map Shim Behaviors", function () {
      let response = {};
      let dom;

      before(async function () {
        response = await fetch(`${hostname}:${port}/`, {
          headers: {
            accept: "text/html",
          },
        });

        dom = new JSDOM(await response.clone().text());
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.contain("text/html");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);

        done();
      });

      // <script type="importmap-shim">{ "imports": {} }</script>
      it("should have a shim-ed importmaps <script> tag in the <head> tag", function (done) {
        const scriptTags = Array.from(
          dom.window.document.querySelectorAll('head > script[type="importmap-shim"'),
        );

        expect(scriptTags.length).to.equal(1);
        done();
      });

      it("should merge project aliases, dependency mappings, and authored overrides before modules", function () {
        const mapScript = dom.window.document.querySelector('head > script[type="importmap-shim"]');
        const { imports } = JSON.parse(mapScript.textContent);

        expect(imports.lit).to.contain("/node_modules/lit/");
        expect(imports["#/"]).to.match(/^\/~\/.*\/src\/$/);
        expect(imports["#title"]).to.equal(`${imports["#/"]}data/title.json`);
        expect(imports["#override"]).to.equal("/data/title.json");
        expect(imports["#/private/"]).to.equal(null);
        expect(
          mapScript.compareDocumentPosition(
            dom.window.document.querySelector('script[type="module-shim"]'),
          ),
        ).to.equal(dom.window.Node.DOCUMENT_POSITION_FOLLOWING);
      });

      it("should preserve JSON import attributes and serve JSON through directory and exact aliases", async function () {
        const { imports } = JSON.parse(
          dom.window.document.querySelector('script[type="importmap-shim"]').textContent,
        );
        const hero = await fetch(`${hostname}:${port}/components/hero.js`);
        const contents = await hero.text();

        expect(contents).to.contain('from "#/data/title.json" with { type: "json" }');
        expect(contents).to.contain('from "#title" with { type: "json" }');

        for (const target of [`${imports["#/"]}data/title.json`, imports["#title"]]) {
          const response = await fetch(`${hostname}:${port}${target}`);

          expect(response.status).to.equal(200);
          expect(response.headers.get("content-type")).to.contain("application/json");
          expect(await response.json()).to.deep.equal({
            title: "Welcome to my website",
            subtitle: "Get Started",
          });
        }
      });

      // <script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>
      it("should have a <script> tag for loading the shim library", function (done) {
        const scriptTags = Array.from(
          dom.window.document.querySelectorAll('head > script[src*="node_modules/es-module-shims"'),
        );

        expect(scriptTags.length).to.equal(1);
        done();
      });

      // <script type="module-shim" src="./components/hero.js"></script>
      it("should have a shim-ed <script> tag for the <app-hero> tag", function (done) {
        const scriptTags = Array.from(
          dom.window.document.querySelectorAll('head > script[src*="hero.js"'),
        );

        expect(scriptTags.length).to.equal(1);
        expect(scriptTags[0].getAttribute("type")).to.equal("module-shim");
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
