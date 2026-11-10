/*
 * Use Case
 * Run Greenwood develop with prerendering and loader hooks for CSS and JSON import attributes.
 *
 * User Result
 * Should return prerendered declarative shadow DOM containing data imported from JSON,
 * while retaining the component script for the browser.
 *
 * User Command
 * node --import @greenwood/cli/register node_modules/.bin/greenwood develop
 *
 * User Config
 * {
 *   prerender: true
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero/
 *       hero.css
 *       hero.js
 *       hero.json
 *   index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Development Prerendering with Import Attributes";
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

    describe("Prerendered HTML with CSS and JSON imports", function () {
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

      it("should prerender components whose CSS and JSON imports use loader hooks", function () {
        const template = dom.window.document.querySelector(
          'app-hero template[shadowrootmode="open"]',
        );
        expect(template.content.querySelector("h2").textContent).to.equal("Welcome to my website");
        expect(dom.window.document.querySelector('script[src*="hero.js"]')).not.to.equal(null);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
