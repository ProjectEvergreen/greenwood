/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph using its own custom schema and query.
 * Needs prerender to be true to get SSR and client side GQL fetching.
 *
 * User Result
 * Should generate a Greenwood build that tests basic output from the custom query.
 *
 * User Command
 * greenwood build
 *
 * Default Config (+ plugin-graphql and prerender)
 *
 * Custom Workspace
 * src/
 *   data/
 *     queries/
 *       gallery.gql
 *     schema/
 *       gallery.js
 *   pages/
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
  const LABEL = "Custom Query from GraphQL";
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

    describe("Home Page output w/ (custom) GalleryQuery", function () {
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

      describe("content output from the <photo-gallery></photo-gallery> component", function () {
        const title = "Home Page Logos";

        it("should have a expected image tag content", function () {
          const images = dom.window.document.querySelectorAll("photo-gallery img");

          expect(images.length).to.be.equal(3);

          images.forEach((image, i) => {
            const count = (i += 1);
            expect(image.src).to.contain(`/assets/logo${count}.png`);
            expect(image.title).to.contain(`${title} - Logo #${count}`);
          });
        });

        it("should have a expected title content in the <h2> tag", function () {
          const heading = dom.window.document.querySelectorAll("photo-gallery h2");

          expect(heading.length).to.be.equal(1);
          expect(heading[0].textContent).to.be.equal(title);
        });
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
