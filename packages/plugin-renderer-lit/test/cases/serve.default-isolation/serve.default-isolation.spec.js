/*
 * Use Case
 * Run Greenwood with isolated Lit SSR pages and an API route using dynamic file-based routing.
 *
 * User Result
 * Should preserve dynamic route params for an API route, getBody, and a default export LitElement.
 *
 * User Command
 * greenwood build && greenwood serve
 *
 * User Config
 * import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';
 *
 * {
 *   isolation: true,
 *   plugins: [greenwoodPluginRendererLit()]
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     api/
 *       product/
 *         [id].js
 *     artist/
 *       [name].js # getBody
 *     product/
 *       [id].js # default export
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Custom Lit Renderer for SSR With Isolation";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "serve", {
            onStdOut: (message) => {
              if (message.includes(`Started server at ${hostname}`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    it("should pass dynamic params to an isolated API route rendering Lit HTML", async function () {
      for (const id of ["1", "2"]) {
        const response = await fetch(`${hostname}/api/product/${id}`);
        const dom = new JSDOM(await response.text());

        expect(response.status).to.equal(200);
        expect(response.headers.get("content-type")).to.equal("text/html");
        expect(dom.window.document.querySelector("h1").textContent).to.equal(`Product ID: ${id}`);
      }
    });

    it("should pass dynamic params to an isolated SSR page using getBody", async function () {
      for (const name of ["analog", "another-artist"]) {
        const response = await fetch(`${hostname}/artist/${name}/`);
        const dom = new JSDOM(await response.text());

        expect(response.status).to.equal(200);
        expect(dom.window.document.querySelector("h1").textContent).to.equal(`Artist: ${name}`);
      }
    });

    it("should pass dynamic params to an isolated SSR page using a default-export LitElement", async function () {
      for (const id of ["1", "2"]) {
        const response = await fetch(`${hostname}/product/${id}/`);
        const dom = new JSDOM(await response.text());

        expect(response.status).to.equal(200);
        expect(dom.window.document.querySelector("p").textContent).to.equal(`Product ID: ${id}`);
      }
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
