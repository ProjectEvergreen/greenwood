/*
 * Use Case
 * Run Greenwood build command with prerender and active content, using Content as Data APIs
 * with a hyphenated collection name ("my-posts") and a hyphenated route ("/my-blog"), rendered
 * through SSR'd custom elements.
 *
 * User Result
 * Should generate a Greenwood build where the prerendered components list the pages of the
 * hyphenated collection / route, and the emitted data-*.json query files contain those pages
 * (regression for content keys being split on every hyphen).
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
 * src/
 *   components/
 *     posts-list.js       (getContentByCollection("my-posts"))
 *     routes-list.js      (getContentByRoute("/my-blog"))
 *   pages/
 *     my-blog/
 *       first.html        (collection: my-posts)
 *       second.html       (collection: my-posts)
 *     index.html
 */

// https://github.com/ProjectEvergreen/greenwood/issues/1715
import fs from "node:fs/promises";
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL =
    "Prerender Configuration turned on using Content as Data with a hyphenated collection";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Default output for index.html with hyphenated collection content", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      describe("post links from getContentByCollection('my-posts')", function () {
        let postLinks;

        before(function () {
          postLinks = dom.window.document.querySelectorAll("ol li a");
        });

        it("should have the expected number of post links from all pages in the collection", function () {
          expect(postLinks.length).to.equal(2);
        });

        it("should have the expected link content from all pages in the collection", function () {
          expect(postLinks[0].getAttribute("href")).to.equal("/my-blog/first/");
          expect(postLinks[0].getAttribute("title")).to.equal("First Post");
          expect(postLinks[0].textContent).to.equal("First");

          expect(postLinks[1].getAttribute("href")).to.equal("/my-blog/second/");
          expect(postLinks[1].getAttribute("title")).to.equal("Second Post");
          expect(postLinks[1].textContent).to.equal("Second");
        });
      });

      describe("page links from getContentByRoute('/my-blog')", function () {
        let pageLinks;

        before(function () {
          pageLinks = dom.window.document.querySelectorAll("ul li a");
        });

        it("should have the expected number of page links for the hyphenated route", function () {
          expect(pageLinks.length).to.equal(2);
        });

        it("should have the expected link content for the hyphenated route", function () {
          expect(pageLinks[0].getAttribute("href")).to.equal("/my-blog/first/");
          expect(pageLinks[1].getAttribute("href")).to.equal("/my-blog/second/");
        });
      });
    });

    describe("Emitted data query files for the hyphenated content keys", function () {
      it("should emit a collection query file with the pages of the hyphenated collection", async function () {
        const collectionData = JSON.parse(
          await fs.readFile(
            path.resolve(this.context.publicDir, "./data-collection-my-posts.json"),
            "utf-8",
          ),
        );
        const routes = collectionData.map((page) => page.route).sort();

        expect(collectionData.length).to.equal(2);
        expect(routes).to.deep.equal(["/my-blog/first/", "/my-blog/second/"]);
      });

      it("should emit a route query file with the pages of the hyphenated route", async function () {
        const routeData = JSON.parse(
          await fs.readFile(
            path.resolve(this.context.publicDir, "./data-route-_my-blog.json"),
            "utf-8",
          ),
        );
        const routes = routeData.map((page) => page.route).sort();

        expect(routeData.length).to.equal(2);
        expect(routes).to.deep.equal(["/my-blog/first/", "/my-blog/second/"]);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
