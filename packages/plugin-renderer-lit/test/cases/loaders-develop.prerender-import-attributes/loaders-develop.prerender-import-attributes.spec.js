/*
 * Use Case
 * Run Greenwood develop with the Lit renderer, prerendering, and loader hooks for CSS and JSON import attributes.
 *
 * User Result
 * Should prerender Lit templates using imported JSON data, include imported styles in declarative shadow DOM,
 * and retain the hydration support script for the browser.
 *
 * User Command
 * node --import @greenwood/cli/register node_modules/.bin/greenwood develop
 *
 * User Config
 * import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';
 *
 * {
 *   prerender: true,
 *   plugins: [greenwoodPluginRendererLit()]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     header/
 *       header.css
 *       header.js
 *       nav.json
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Lit Development Prerendering with Import Attributes";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://127.0.0.1:1984";
  let runner;

  before(function () {
    runner = new Runner(false, true);
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes("Started local development server at http://localhost:1984")) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Prerendered Lit HTML with import attributes", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should prerender Lit templates and imported styles using loader hooks", function () {
        const template = dom.window.document.querySelector(
          'app-header template[shadowrootmode="open"]',
        );
        const items = [...template.content.querySelectorAll("nav li")];
        expect(items.map((item) => item.textContent)).to.deep.equal(["Home", "About"]);
        const style = template.content
          .querySelector("style")
          .textContent.replace(/\s/g, "")
          .replace(/;}/g, "}");
        expect(style).to.equal("header{color:red}");
        expect(dom.window.document.querySelector('script[data-gwd="hydration"]')).not.to.equal(
          null,
        );
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
