/*
 * Use Case
 * Run Greenwood develop with prerendering enabled using the Lit renderer plugin.
 *
 * User Result
 * Should return prerendered declarative shadow DOM from Lit components and retain client scripts.
 * Should place hydration support after import maps and before component scripts.
 *
 * User Command
 * greenwood develop
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
 *     greeting.js
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
  const LABEL = "Lit Development Prerendering";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://127.0.0.1:1984";
  let runner;

  before(function () {
    runner = new Runner();
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

    describe("Prerendered Lit page", function () {
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

      it("should serve declarative shadow DOM from the configured Lit renderer", function () {
        const template = dom.window.document.querySelector(
          'lit-greeting template[shadowrootmode="open"]',
        );
        expect(template.content.querySelector("p").textContent).to.equal(
          "Hello from prerendered Lit",
        );
      });

      it("should preserve hydration support after import maps and before component scripts", function () {
        const scripts = [...dom.window.document.querySelectorAll("head script")];
        const importMap = scripts.findIndex((script) => script.type === "importmap");
        const hydration = scripts.findIndex(
          (script) => script.getAttribute("data-gwd") === "hydration",
        );
        const component = scripts.findIndex(
          (script) => script.getAttribute("src") === "/components/greeting.js",
        );
        expect(importMap).to.be.greaterThan(-1);
        expect(hydration).to.be.greaterThan(importMap);
        expect(component).to.be.greaterThan(hydration);
        expect(
          scripts.filter((script) => script.getAttribute("data-gwd") === "hydration"),
        ).to.have.length(1);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
