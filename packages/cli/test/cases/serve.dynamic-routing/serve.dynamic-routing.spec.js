/*
 * Use Case
 * Run Greenwood with SSR routes that use dynamic file-based routing.
 *
 * User Result
 * Should server a Greenwood project that can handle dynamic segments in page and API routes.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {}
 *
 * User Workspace
 *  src/
 *   pages/
 *     blog/
 *       [slug].ts
 */
import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Serve Greenwood With: ", function () {
  const LABEL = "Dynamic Routing";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://127.0.0.1:8080";
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

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, "serve");
      });
    });

    describe("An SSR page with a dynamic route segment", function () {
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
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
