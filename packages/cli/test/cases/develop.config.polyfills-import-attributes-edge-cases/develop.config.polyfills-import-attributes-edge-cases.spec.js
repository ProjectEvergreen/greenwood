/*
 * Use Case
 * Run Greenwood develop command with the import attributes polyfill enabled against JavaScript
 * that exercises the tricky inputs that a naive whole-file string rewrite mangles: a commented-out
 * copy of an import, a binding name containing "with", two imports of the same specifier, a
 * multi-line attributes clause, a specifier repeated inside a string literal, a dynamic import
 * with a `with` options object, and a file using the legacy `assert` keyword.
 *
 * User Result
 * Should start the development server and polyfill exactly the real import specifiers
 * (one `?polyfill=type-css` / `?polyfill=type-json` each), leaving comments and string literals
 * untouched, and pass through un-parseable `assert` syntax without bricking the response.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * polyfills: {
 *   importAttributes: ['css', 'json']
 * }
 *
 * User Workspace
 * src/
 *   main.js
 *   legacy.js
 *   theme.css
 *   shared.css
 *   dynamic.css
 *   data.json
 *   config.json
 *   index.html
 * greenwood.config.js
 * package.json
 *
 */
import { expect } from "chai";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1721
describe("Develop Greenwood With: ", function () {
  const LABEL = "Import Attributes Polyfill Edge Cases Configuration";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1985;
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

    describe("Import Attributes Polyfill Behaviors for the tricky JavaScript file (main.js)", function () {
      let response = {};
      let text;
      let stripped;

      before(async function () {
        response = await fetch(`${hostname}:${port}/main.js`, {
          headers: {
            accept: "text/html",
          },
        });

        text = await response.clone().text();
        stripped = text.replace(/ /g, "");
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.contain("text/javascript");
        done();
      });

      it("should return a 200", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should polyfill an import whose binding name contains 'with' (not truncate it)", function (done) {
        expect(stripped).to.contain('importwithThemefrom"./theme.css?polyfill=type-css"');
        expect(stripped).to.not.contain("import;");
        done();
      });

      it("should polyfill both imports of the same specifier exactly once each", function (done) {
        expect(stripped).to.contain('importafrom"./shared.css?polyfill=type-css"');
        expect(stripped).to.contain('importbfrom"./shared.css?polyfill=type-css"');
        expect(text).to.not.contain("?polyfill=type-css?polyfill=type-css");
        done();
      });

      it("should polyfill a multi-line attributes clause", function (done) {
        expect(stripped).to.contain('importconfigfrom"./data.json?polyfill=type-json"');
        done();
      });

      it("should polyfill a dynamic import and drop its `with` options argument", function (done) {
        expect(stripped).to.contain('import("./dynamic.css?polyfill=type-css")');
        done();
      });

      it("should leave a commented-out copy of an import untouched", function (done) {
        expect(text).to.contain(
          '// import shadow from "./theme.css" with { type: "css" }; older commented-out example',
        );
        done();
      });

      it("should leave the import syntax inside a string literal untouched", function (done) {
        expect(text).to.contain(
          '\'example: import sheet from "./theme.css" with { type: "css" };\'',
        );
        done();
      });

      // discriminating case #2: `./banner.css` appears verbatim in a string literal BEFORE its
      // real import with no shadowing comment, so the old whole-file replace mangles the string
      it("should not mangle a string literal that duplicates a real import's specifier", function (done) {
        expect(text).to.contain('run: import banner from "./banner.css" with { type: "css" };');
        expect(stripped).to.contain('importbannerfrom"./banner.css?polyfill=type-css"');
        done();
      });
    });

    describe("Import Attributes Polyfill Behavior for legacy `assert` syntax (legacy.js)", function () {
      let response = {};
      let text;

      before(async function () {
        response = await fetch(`${hostname}:${port}/legacy.js`, {
          headers: {
            accept: "text/html",
          },
        });

        text = await response.clone().text();
      });

      it("should not brick the response and returns a 200", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should pass the un-parseable source through unmodified", function (done) {
        expect(text).to.contain('import legacy from "./config.json" assert { type: "json" };');
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
