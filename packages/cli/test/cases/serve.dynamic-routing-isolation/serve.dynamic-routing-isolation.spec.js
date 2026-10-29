/*
 * Use Case
 * Run Greenwood with SSR and API routes that use dynamic file-based routing and isolation mode.
 *
 * User Result
 * Should serve a Greenwood project that preserves dynamic route params with isolation enabled.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   isolation: true
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     api/
 *       product/
 *         [id].ts
 *     blog/
 *       [slug].ts
 *     product/
 *       [name].js
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Dynamic Routing With Isolation";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
      hostname,
    };
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

    describe("An SSR page with a dynamic route segment with default export", function () {
      const slug = "my-first-blog-post";
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/blog/${slug}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected output for the page", function () {
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(response.status).to.equal(200);
        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal(slug);
      });
    });

    describe("An SSR page with a dynamic route segment with getBody", function () {
      const name = "my-cool-product";
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/product/${name}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected output for the page", function () {
        const headings = dom.window.document.querySelectorAll("h1");

        expect(response.status).to.equal(200);
        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal(name);
      });
    });

    it("should pass each request's params to isolated default export and getBody routes", async function () {
      for (const route of ["blog", "product"]) {
        for (const value of ["first-item", "second-item"]) {
          const response = await fetch(`${hostname}/${route}/${value}/`);
          const dom = new JSDOM(await response.text());
          const headings = dom.window.document.querySelectorAll("body > h1");

          expect(response.status).to.equal(200);
          expect(headings.length).to.equal(1);
          expect(headings[0].textContent).to.equal(value);
        }
      }
    });

    describe("An API route with a dynamic route segment", function () {
      const id = "1";
      let body;

      before(async function () {
        const response = await fetch(`${hostname}/api/product/${id}`);
        body = await response.clone().text();
      });

      it("should have the expected output for the page", function () {
        expect(body).to.equal(`Product id is => ${id}`);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
