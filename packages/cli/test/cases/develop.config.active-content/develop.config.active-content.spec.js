/*
 * Use Case
 * Run Greenwood develop command using various content as data APIs.
 *
 * User Result
 * Should start the dev server with the expected generated output using custom elements.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {
 *   activeContent: true
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *    blog-posts-lists.js
 *    header.js
 *    toc.js
 *   pages/
 *     blog/
 *       first-post.html
 *       second-post.html
 *       index.html
 *     contact.html
 *     index.html
 *     pricing.html
 *     toc.html
 */

import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Active Content";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1984;
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
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
              if (message.includes(`Started local development server at http://localhost:1984`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Data Client Import Map", () => {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}:${port}/`);
        dom = new JSDOM(await response.text());
      });

      it("should have a <script> tag of type importmap", async () => {
        const map = dom.window.document.querySelectorAll('script[type="importmap"]');

        expect(map.length).to.equal(1);
      });

      it("should have the expected entry in the importmap", async () => {
        const map = dom.window.document.querySelectorAll('script[type="importmap"]');
        const contents = JSON.parse(map[0].textContent);

        expect(contents.imports["@greenwood/cli/src/data/client.js"]).to.equal(
          "/node_modules/@greenwood/cli/src/data/client.js",
        );
      });
    });

    describe("Content Request Types", () => {
      describe("Graph Request", () => {
        let response;

        before(async function () {
          response = await fetch(`${hostname}:${port}/___graph.json`, {
            method: "GET",
            headers: {
              "x-content-key": "graph",
            },
          });
        });

        it("should have the expected content response data", async () => {
          const data = await response.json();

          expect(data.length).to.equal(7);
        });
      });

      describe("Route Request", () => {
        let response;

        before(async function () {
          response = await fetch(`${hostname}:${port}/___graph.json`, {
            headers: {
              "x-content-key": "route-/blog",
            },
          });
        });

        it("should have the expected content response data", async () => {
          const data = await response.json();

          expect(data.length).to.equal(3);
        });
      });

      describe("Collections Request", () => {
        let response;

        before(async function () {
          response = await fetch(`${hostname}:${port}/___graph.json`, {
            headers: {
              "x-content-key": "collection-nav",
            },
          });
        });

        it("should have the expected content response data", async () => {
          const data = await response.json();

          expect(data.length).to.equal(4);
        });
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1743
    describe("Active Frontmatter values containing replacement patterns", () => {
      let dom;
      let html;

      before(async function () {
        const response = await fetch(`${hostname}:${port}/pricing/`);

        html = await response.text();
        dom = new JSDOM(html);
      });

      it("should interpolate a custom data frontmatter value with $&, $` and $1 verbatim", function () {
        const money = dom.window.document.querySelector("body p.money").textContent;

        expect(money).to.be.equal("pay $& now $` later and $1 tomorrow");
      });

      it("should interpolate an active frontmatter title value with $& verbatim in the <head>", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("costs $& per month");
      });

      it("should interpolate an active frontmatter title value with $& verbatim in the <body>", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("costs $& per month");
      });

      it("should not duplicate the page inside itself", function () {
        const headings = dom.window.document.querySelectorAll("h1");

        expect(headings.length).to.be.equal(1);
        expect(html.match(/<p class="money">/g).length).to.be.equal(1);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
