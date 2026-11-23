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
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Dynamic Routing";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://localhost:1984";
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliUrl, {
            args: "develop",
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
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
