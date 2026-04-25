/*
 * Use Case
 * Run Greenwood with SSR routes and API route that use getStaticPaths / getStaticParams file-based routing.
 *
 * User Result
 * Should run the Greenwood dev server can handle static generation for dynamic routes.
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
 *     blog/
 *       [slug].ts
 *     product/
 *       [name].js
 *   services/
 *     blog-posts.ts
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Develop Greenwood With: ", function () {
  const LABEL = "Dynamic Routing for Get Static Paths and Get Static Params";
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
      const slug = "first-post";
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/blog/${slug}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected output for the page in the title", function () {
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("First Post");
      });

      it("should have the expected output for the page in the content", function () {
        const paragraphs = dom.window.document.querySelectorAll("body > p");

        expect(paragraphs.length).to.equal(1);
        expect(paragraphs[0].textContent).to.equal("This is the first post.");
      });
    });

    describe("An SSR page with a dynamic route segment with getBody", function () {
      const name = "My Cool Product";
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/product/${name.replace(/ /g, "-").toLowerCase()}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected output for the page", function () {
        const headings = dom.window.document.querySelectorAll("h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal(name);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
