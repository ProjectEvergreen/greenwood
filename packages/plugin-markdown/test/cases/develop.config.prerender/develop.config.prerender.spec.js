/*
 * Use Case
 * Run Greenwood develop with prerendering enabled for Markdown pages.
 *
 * User Result
 * Should prerender components imported through Markdown frontmatter and remove their static scripts.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * import { greenwoodPluginMarkdown } from '@greenwood/plugin-markdown';
 *
 * {
 *   prerender: true,
 *   plugins: [greenwoodPluginMarkdown()]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.md
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Markdown Prerendering";
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

    describe("Markdown page with frontmatter imports", function () {
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

      it("should prerender the imported component and remove its static script", function () {
        expect(dom.window.document.querySelector("h1").textContent).to.equal(
          "Markdown prerendering",
        );
        expect(dom.window.document.querySelector("app-header header").textContent).to.equal(
          "Prerendered Markdown header",
        );
        expect(dom.window.document.querySelector('script[src="/components/header.js"]')).to.equal(
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
