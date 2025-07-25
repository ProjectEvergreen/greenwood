/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using ChildrenQuery.
 *
 * Needs prerender to be true to get SSR and client side GQL fetching.
 *
 * User Result
 * Should generate a Greenwood build that tests basic output from the ChildrenQuery.
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
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Children from GraphQL";
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
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
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Home Page output w/ ChildrenQuery", function () {
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
        expect(
          await glob.promise(path.join(this.context.publicDir, "./*-cache.json")),
        ).to.have.lengthOf(1);
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

      it("should have a expected navigation output in the <header> based on pages that are children of the blog route", function () {
        const listItems = dom.window.document.querySelectorAll("body ul li");

        expect(listItems.length).to.be.equal(2);

        expect(listItems[0].innerHTML).to.contain("First Post");
        expect(listItems[1].innerHTML).to.contain("Second Post");
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
