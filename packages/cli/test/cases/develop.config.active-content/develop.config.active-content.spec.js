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
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Active Content";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      hostname = await startServer(runner, cliPath, "develop");
      this.context.hostname = hostname;
    });

    describe("Data Client Import Map", () => {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/`);
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
          response = await fetch(`${hostname}/___graph.json`, {
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
          response = await fetch(`${hostname}/___graph.json`, {
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
          response = await fetch(`${hostname}/___graph.json`, {
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

    // https://github.com/ProjectEvergreen/greenwood/issues/1788
    describe("Content Request Errors", function () {
      describe("Missing Content Key", function () {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/___graph.json`);
        });

        it("should return a 403 status", function () {
          expect(response.status).to.equal(403);
        });
      });

      describe("Unrecognized Content Key", function () {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/___graph.json`, {
            headers: {
              "x-content-key": "bogus-key",
            },
          });
        });

        it("should return a 400 status", function () {
          expect(response.status).to.equal(400);
        });
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1743
    describe("Active Frontmatter values containing replacement patterns", () => {
      let dom;
      let html;

      before(async function () {
        const response = await fetch(`${hostname}/pricing/`);

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
    await stopServer(runner);
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
