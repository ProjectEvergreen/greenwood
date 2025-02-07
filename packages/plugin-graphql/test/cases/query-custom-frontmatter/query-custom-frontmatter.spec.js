/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using ChildrenQuery, simulating
 * a link of blog posts derivered from a pages/blog directory with custom frontmatter.  Also uses LitElement.
 *
 * Needs prerender to be true to get SSR and client side GQL fetching.
 *
 * User Result
 * Should generate a Greenwood build that dynamically serializes data from the graph in the body
 * of the home page as a list of blog post links.
 *
 * User Command
 * greenwood build
 *
 * Default Config (+ plugin-graphql and prerender)
 *
 * Custom Workspace
 * src/
 *   components/
 *     posts-list.js
 *   pages/
 *     blog/
 *       first-post/
 *         index.md
 *       second-post/
 *         index.md
 *     index.html
 */
import chai from "chai";
import fs from "fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom GraphQuery for Front Matter from GraphQL";
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
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

    describe("Home Page <posts-list> w/ custom Graph query", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
      });

      it("should have one window.__APOLLO_STATE__ <script> with (approximated) expected state", function () {
        const scriptTags = dom.window.document.querySelectorAll("head script");
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter((script) => {
          return script.getAttribute("data-state") === "apollo";
        });
        const innerHTML = apolloScriptTags[0].innerHTML;

        expect(apolloScriptTags.length).to.equal(1);
        expect(innerHTML).to.match(apolloStateRegex);
      });

      it("should output a single (partial) *-cache.json file, one per each query made", async function () {
        const cacheFiles = await glob.promise(path.join(this.context.publicDir, "./*-cache.json"));

        expect(cacheFiles).to.have.lengthOf(1);
      });

      it("should output a (partial) *-cache.json files, one per each query made, that are all defined", async function () {
        const cacheFiles = await glob.promise(path.join(this.context.publicDir, "./*-cache.json"));

        cacheFiles.forEach((file) => {
          const cache = JSON.parse(fs.readFileSync(file, "utf-8"));

          expect(cache).to.not.be.undefined;
        });
      });

      it("should have a <ul> in the <body>", function () {
        const lists = dom.window.document.querySelectorAll("body ul");

        expect(lists.length).to.be.equal(1);
      });

      it("should have a expected Query output in the <body> tag for posts list links", function () {
        const listItems = dom.window.document.querySelectorAll("body ul li");
        const link1 = listItems[0].querySelector("a");
        const link2 = listItems[1].querySelector("a");

        expect(listItems.length).to.be.equal(2);

        expect(link1.href.replace("file://", "").replace(/\/[A-Z]:/, "")).to.be.equal(
          "/blog/first-post/",
        );
        expect(link1.title).to.be.equal("Click to read my First blog post");
        expect(link1.innerHTML).to.contain("First");

        expect(link2.href.replace("file://", "").replace(/\/[A-Z]:/, "")).to.be.equal(
          "/blog/second-post/",
        );
        expect(link2.title).to.be.equal("Click to read my Second blog post");
        expect(link2.innerHTML).to.contain("Second");
      });

      it("should have a expected Query output in the <body> tag for posts list authors and dates from custom frontmatter", function () {
        const authors = dom.window.document.querySelectorAll("body ul li span.author");
        const dates = dom.window.document.querySelectorAll("body ul li span.date");

        expect(authors.length).to.be.equal(2);
        expect(dates.length).to.be.equal(2);

        // account for dynamic hydration markers added by lit
        expect(authors[0].innerHTML).to.match(/Written By:(.*.)someone@blog.com/);
        expect(dates[0].innerHTML).to.match(/On:(.*.)07.08.2020/);

        expect(authors[1].innerHTML).to.match(/Written By:(.*.)someone_else@blog.com/);
        expect(dates[1].innerHTML).to.match(/On:(.*.)07.09.2020/);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
