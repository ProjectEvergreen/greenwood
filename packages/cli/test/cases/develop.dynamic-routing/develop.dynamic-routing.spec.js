/*
 * Use Case
 * Run Greenwood with SSR routes and API route that use dynamic file-based routing.
 *
 * User Result
 * Should run the Greenwood dev server can handle dynamic segments in page and API routes.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {}
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
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "Dynamic Routing";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:1984";
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

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes(`Started local development server at ${hostname}`)) {
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

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal(name);
      });
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
