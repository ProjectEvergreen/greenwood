/*
 * Use Case
 * Run Greenwood build command with prerender config set to true and using various Content as Data APIs.
 *
 * User Result
 * Should generate a Greenwood build with the expected generated output using custom elements.
 *
 * User Command
 * greenwood build
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
 *    footer.js
 *    header.js
 *    toc.js
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *       index.html
 *     index.html
 *     toc.html
 */

import chai from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Prerender Configuration turned on using Content As Data collections";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Default output for index.html with header nav collection content", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      describe("Data Client Import Map", () => {
        let map;

        before(function () {
          map = dom.window.document.querySelectorAll('script[type="importmap"]');
        });

        it("should not have a <script> tag of type importmap", async () => {
          expect(map.length).to.equal(0);
        });
      });

      describe("<script> tag setup for active content", function () {
        let stateScripts;
        let optionsScript;

        before(function () {
          stateScripts = dom.window.document.querySelectorAll("script#content-as-data-state");
          optionsScript = dom.window.document.querySelectorAll("script#data-client-options");
        });

        it("should have a <script> tag that confirms content as data is set", function () {
          expect(stateScripts.length).to.equal(1);
          expect(stateScripts[0].textContent).to.contain(
            "globalThis.__CONTENT_AS_DATA_STATE__ = true;",
          );
        });

        it("should have a <script> tag that captures content as data related options", function () {
          expect(optionsScript.length).to.equal(1);

          expect(optionsScript[0].textContent).to.contain("PORT:1984");
          expect(optionsScript[0].textContent).to.contain('PRERENDER:"true"');
        });
      });

      describe("navigation links from getContentByCollection", function () {
        let navLinks;

        before(function () {
          navLinks = dom.window.document.querySelectorAll("header nav ul li a");
        });

        it("should have the expected number of nav links from all pages in the collection", function () {
          expect(navLinks.length).to.equal(4);
        });

        it("should have the expected link content from all pages in the collection", function () {
          expect(navLinks[0].getAttribute("href")).to.equal("/");
          expect(navLinks[0].getAttribute("title")).to.equal("Home");
          expect(navLinks[0].textContent).to.equal("Home");

          expect(navLinks[1].getAttribute("href")).to.equal("/blog/");
          expect(navLinks[1].getAttribute("title")).to.equal("Blog");
          expect(navLinks[1].textContent).to.equal("Blog");

          expect(navLinks[2].getAttribute("href")).to.equal("/toc/");
          expect(navLinks[2].getAttribute("title")).to.equal("Table of Contents");
          expect(navLinks[2].textContent).to.equal("Table of Contents");

          expect(navLinks[3].getAttribute("href")).to.equal("/external/");
          expect(navLinks[3].getAttribute("title")).to.equal("External Page");
          expect(navLinks[3].textContent).to.equal("External Page");
        });

        it("should have the expected inline active frontmatter collection data", function () {
          const collection = JSON.parse(
            dom.window.document.querySelector("body span#nav").textContent,
          ).sort((a, b) => (a.data.order > b.data.order ? 1 : -1));

          expect(collection[0].route).to.equal("/");
          expect(collection[0].title).to.equal("Home");
          expect(collection[0].label).to.equal(collection[0].title);
          expect(collection[0].id).to.equal("index");

          expect(collection[1].route).to.equal("/blog/");
          expect(collection[1].title).to.equal("Blog");
          expect(collection[1].label).to.equal(collection[1].title);
          expect(collection[1].id).to.equal("blog-index");

          expect(collection[2].route).to.equal("/toc/");
          expect(collection[2].title).to.equal("Table of Contents");
          expect(collection[2].label).to.equal(collection[2].title);
          expect(collection[2].id).to.equal("toc");
        });
      });

      describe("footer links from getContentByCollection array items", function () {
        let linkItems;

        before(function () {
          linkItems = dom.window.document.querySelectorAll("footer ul li a");
        });

        it("should have the expected number of nav links from all pages in the collection", function () {
          expect(linkItems.length).to.equal(2);
        });

        it("should have the expected link content from all pages in the collection", function () {
          expect(linkItems[0].getAttribute("href")).to.equal("/blog/");
          expect(linkItems[0].getAttribute("title")).to.equal("Blog");
          expect(linkItems[0].textContent).to.equal("Blog");

          expect(linkItems[1].getAttribute("href")).to.equal("/toc/");
          expect(linkItems[1].getAttribute("title")).to.equal("Table of Contents");
          expect(linkItems[1].textContent).to.equal("Table of Contents");
        });

        it("should have the expected inline active frontmatter collection data", function () {
          const collection = JSON.parse(
            dom.window.document.querySelector("body span#footer").textContent,
          );

          expect(collection[0].route).to.equal("/blog/");
          expect(collection[0].title).to.equal("Blog");
          expect(collection[0].label).to.equal(collection[0].title);
          expect(collection[0].id).to.equal("blog-index");

          expect(collection[1].route).to.equal("/toc/");
          expect(collection[1].title).to.equal("Table of Contents");
          expect(collection[1].label).to.equal(collection[1].title);
          expect(collection[1].id).to.equal("toc");
        });
      });
    });

    describe("Default output for blog/index.html with routes based collection content", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./blog/index.html"));
      });

      describe("navigation links from getContentByCollection", function () {
        let postLinks;

        before(function () {
          postLinks = dom.window.document.querySelectorAll("ol li a");
        });

        it("should have the expected number of post links from all blog pages in the collection (minus the index route)", function () {
          expect(postLinks.length).to.equal(2);
        });

        it("should have the expected link content from all pages in the collection", function () {
          expect(postLinks[0].getAttribute("href")).to.equal("/blog/first-post/");
          expect(postLinks[0].getAttribute("title")).to.equal("First Post");
          expect(postLinks[0].textContent).to.equal("First Post");

          expect(postLinks[1].getAttribute("href")).to.equal("/blog/second-post/");
          expect(postLinks[1].getAttribute("title")).to.equal("Second Post");
          expect(postLinks[1].textContent).to.equal("Second Post");
        });
      });
    });

    describe("Default output for toc.html with all content in a list", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./toc/index.html"));
      });

      describe("navigation links from getContentByCollection", function () {
        let pageLinks;

        before(function () {
          pageLinks = dom.window.document.querySelectorAll("ol li a");
        });

        // includes 404 page
        it("should have the expected number of post links from all pages in the collection (minus the index route)", function () {
          expect(pageLinks.length).to.equal(7);
        });
      });
    });
  });

  after(async function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
