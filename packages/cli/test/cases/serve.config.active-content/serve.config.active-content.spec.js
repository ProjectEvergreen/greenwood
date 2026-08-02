/*
 * Use Case
 * Run Greenwood serve command for a production build using various content as data APIs.
 *
 * User Result
 * Should start the production server with the expected prerendered output using custom elements.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   activeContent: true,
 *   prerender: true
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
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Active Content";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
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

    runSmokeTest(["serve"], LABEL);

    describe("Default output for index.html with header nav collection content", function () {
      let dom;

      before(async function () {
        const response = await fetch(`${hostname}/`);

        dom = new JSDOM(await response.text());
      });

      it("should not have a <script> tag of type importmap", function () {
        const map = dom.window.document.querySelectorAll('script[type="importmap"]');

        expect(map.length).to.equal(0);
      });

      it("should have a <script> tag that confirms content as data is set", function () {
        const stateScripts = dom.window.document.querySelectorAll("script#content-as-data-state");

        expect(stateScripts.length).to.equal(1);
      });

      it("should have a <script> tag that captures content as data related options", function () {
        const optionsScript = dom.window.document.querySelectorAll("script#data-client-options");

        expect(optionsScript.length).to.equal(1);
      });

      it("should have the expected number of prerendered nav links from all pages in the collection", function () {
        const navLinks = dom.window.document.querySelectorAll("x-header nav ul li a");

        expect(navLinks.length).to.equal(4);
      });
    });

    describe("Default output for blog/index.html with routes based collection content", function () {
      let dom;

      before(async function () {
        const response = await fetch(`${hostname}/blog/`);

        dom = new JSDOM(await response.text());
      });

      it("should have the expected number of prerendered post links from all blog pages in the collection (minus the index route)", function () {
        const postLinks = dom.window.document.querySelectorAll("x-posts-list ol li a");

        expect(postLinks.length).to.equal(2);
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1743
    describe("Active Frontmatter values containing replacement patterns", function () {
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

    describe("Prerendered content as data cache files", function () {
      describe("Graph Data", function () {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/data-graph.json`);
        });

        it("should have the expected content response data", async function () {
          const data = await response.json();

          expect(data.length).to.equal(7);
        });
      });

      describe("Route Data", function () {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/data-route-_blog.json`);
        });

        it("should have the expected content response data", async function () {
          const data = await response.json();

          expect(data.length).to.equal(3);
        });
      });

      describe("Collections Data", function () {
        let response;

        before(async function () {
          response = await fetch(`${hostname}/data-collection-nav.json`);
        });

        it("should have the expected content response data", async function () {
          const data = await response.json();

          expect(data.length).to.equal(4);
        });
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
