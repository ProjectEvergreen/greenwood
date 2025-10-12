/*
 * Use Case
 * Run Greenwood with default config and nested directories in workspace with lots of nested pages.
 *
 * Result
 * Test for correctly ordered graph.json and pages output, which by default should mimic
 * the filesystem order by default.
 *
 * Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [greenwoodPluginMarkdown()]
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     blog/
 *       2017/
 *         03/26/index.html
 *         03/30/index.html
 *       2019/
 *         11/11/index.html
 *     index.html
 *   index.html
 *   404.html
 */
import chai from "chai";
import fs from "node:fs";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

function generatePageHref(pagePath) {
  return new URL(`./src/pages/${pagePath}`, import.meta.url).href;
}

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace w/ Nested Directories";
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

    describe("Expected Graph Contents", function () {
      let graph;

      before(async function () {
        graph = JSON.parse(
          await fs.promises.readFile(path.join(this.context.publicDir, "graph.json"), "utf-8"),
        );
      });

      // we _technically_ can't assume the order of pages but we can at least make sure all the files are there
      // this could easily be solved by adding an `order` property to the page's frontmatter
      // https://github.com/ProjectEvergreen/greenwood/pull/1308#issuecomment-3368603613
      it("should have the expected ordering of pages in graph.json", function () {
        expect(graph.length).to.equal(6);

        const page404 = graph.find((page) => page.route === "/404/");
        expect(page404.pageHref).to.equal(generatePageHref("404.html"));
        expect(page404.id).to.be.equal("404");

        const homePage = graph.find((page) => page.route === "/");
        expect(homePage.pageHref).to.equal(generatePageHref("index.html"));
        expect(homePage.id).to.be.equal("index");

        const blogPage = graph.find((page) => page.route === "/blog/");
        expect(blogPage.pageHref).to.equal(generatePageHref("blog/index.html"));
        expect(blogPage.id).to.be.equal("blog-index");

        const nestedPage = graph.find((page) => page.route === "/blog/2019/11/11/");
        expect(nestedPage.pageHref).to.equal(generatePageHref("blog/2019/11/11/index.html"));
        expect(nestedPage.id).to.be.equal("blog-2019-11-11-index");
      });
    });

    describe("Blog Pages Directory", function () {
      let graph;

      before(async function () {
        graph = JSON.parse(
          await fs.promises.readFile(path.join(this.context.publicDir, "graph.json"), "utf-8"),
        );
      });

      it("should create a top level blog pages directory", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "./blog"))).to.be.true;
      });

      it("should create a directory for each year of blog pages", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "blog/2017"))).to.be.true;
        expect(fs.existsSync(path.join(this.context.publicDir, "blog/2019"))).to.be.true;
      });

      it("should have the expected pages for 2017 blog pages", function () {
        graph
          .filter((page) => {
            return page.route.indexOf("2017") > 0;
          })
          .forEach((page) => {
            const outputPath = path.join(this.context.publicDir, page.route, "index.html");
            expect(fs.existsSync(outputPath)).to.be.true;
          });
      });

      it("should have the expected pages for 2019 blog pages", function () {
        graph
          .filter((page) => {
            return page.route.indexOf("2019") > 0;
          })
          .forEach((page) => {
            const outputPath = path.join(this.context.publicDir, page.route, "index.html");
            expect(fs.existsSync(outputPath)).to.be.true;
          });
      });

      it("should have the expected content for each blog page", function () {
        graph
          .filter((page) => {
            return page.route.indexOf(/\/blog\/[0-9]{4}/) > 0;
          })
          .forEach((page) => {
            const contents = fs.readFileSync(
              path.join(this.context.publicDir, page.route, "index.html"),
              "utf-8",
            );

            expect(contents).to.contain(`<p>This is the post for page ${page.data.date}.</p>`);
          });
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
