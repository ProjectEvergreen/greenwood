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
 *         03/26/index.md
 *         03/30/index.md
 *         04/10/index.md
 *         04/22/index.md
 *         05/05/index.md
 *         06/07/index.md
 *         09/10/index.md
 *         10/15/index.md
 *       2018/
 *         01/24/index.md
 *         05/16/index.md
 *         06/06/index.md
 *         09/26/index.md
 *         10/28/index.md
 *         11/19/index.md
 *       2019/
 *         11/11/index.md
 *       2020/
 *         04/07/index.md
 *         08/15/index.md
 *         10/28/index.md
 *     index.md
 *   index.md
 *   404.html
 */
import { expect } from "chai";
import fs from "node:fs";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";

function generatePageHref(pagePath) {
  return new URL(`./src/pages/${pagePath}`, import.meta.url).href;
}

describe("Build Greenwood With Markdown Plugin: ", function () {
  const LABEL = "Default Greenwood Configuration and Default Workspace w/ Nested Directories";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Blog Pages Directory", function () {
      let graph;

      before(async function () {
        graph = JSON.parse(
          await fs.promises.readFile(new URL("graph.json", this.context.publicDir), "utf-8"),
        );
      });

      it("should have the expected ordering of pages in graph.json", function () {
        expect(graph.length).to.equal(21);

        expect(graph[0].pageHref).to.equal(generatePageHref("404.html"));
        expect(graph[0].id).to.be.equal("404");
        expect(graph[1].pageHref).to.equal(generatePageHref("blog/2017/03/26/index.md"));
        expect(graph[1].id).to.be.equal("blog-2017-03-26-index");
        expect(graph[2].pageHref).to.equal(generatePageHref("blog/2017/03/30/index.md"));
        expect(graph[3].pageHref).to.equal(generatePageHref("blog/2017/04/10/index.md"));
        expect(graph[4].pageHref).to.equal(generatePageHref("blog/2017/04/22/index.md"));
        expect(graph[5].pageHref).to.equal(generatePageHref("blog/2017/05/05/index.md"));
        expect(graph[6].pageHref).to.equal(generatePageHref("blog/2017/06/07/index.md"));
        expect(graph[7].pageHref).to.equal(generatePageHref("blog/2017/09/10/index.md"));
        expect(graph[8].pageHref).to.equal(generatePageHref("blog/2017/10/15/index.md"));
        expect(graph[9].pageHref).to.equal(generatePageHref("blog/2018/01/24/index.md"));
        expect(graph[10].pageHref).to.equal(generatePageHref("blog/2018/05/16/index.md"));
        expect(graph[11].pageHref).to.equal(generatePageHref("blog/2018/06/06/index.md"));
        expect(graph[12].pageHref).to.equal(generatePageHref("blog/2018/09/26/index.md"));
        expect(graph[13].pageHref).to.equal(generatePageHref("blog/2018/10/28/index.md"));
        expect(graph[14].pageHref).to.equal(generatePageHref("blog/2018/11/19/index.md"));
        expect(graph[15].pageHref).to.equal(generatePageHref("blog/2019/11/11/index.md"));
        expect(graph[16].pageHref).to.equal(generatePageHref("blog/2020/04/07/index.md"));
        expect(graph[17].pageHref).to.equal(generatePageHref("blog/2020/08/15/index.md"));
        expect(graph[18].pageHref).to.equal(generatePageHref("blog/2020/10/28/index.md"));
        expect(graph[19].pageHref).to.equal(generatePageHref("blog/index.md"));
        expect(graph[19].id).to.be.equal("blog-index");
        expect(graph[20].pageHref).to.equal(generatePageHref("index.html"));
        expect(graph[20].id).to.be.equal("index");
      });

      it("should create a top level blog pages directory", function () {
        expect(fs.existsSync(new URL("blog", this.context.publicDir))).to.be.true;
      });

      it("should create a directory for each year of blog pages", function () {
        expect(fs.existsSync(new URL("blog/2017", this.context.publicDir))).to.be.true;
        expect(fs.existsSync(new URL("blog/2018", this.context.publicDir))).to.be.true;
        expect(fs.existsSync(new URL("blog/2019", this.context.publicDir))).to.be.true;
        expect(fs.existsSync(new URL("blog/2020", this.context.publicDir))).to.be.true;
      });

      it("should have the expected pages for 2017 blog pages", function () {
        graph
          .filter((page) => {
            return page.route.indexOf("2017") > 0;
          })
          .forEach((page) => {
            const pageUrl = new URL(`.${page.route}index.html`, this.context.publicDir);
            expect(fs.existsSync(pageUrl)).to.be.true;
          });
      });

      it("should have the expected pages for 2018 blog pages", function () {
        graph
          .filter((page) => {
            return page.route.indexOf("2018") > 0;
          })
          .forEach((page) => {
            const pageUrl = new URL(`.${page.route}index.html`, this.context.publicDir);
            expect(fs.existsSync(pageUrl)).to.be.true;
          });
      });

      it("should have the expected pages for 2019 blog pages", function () {
        graph
          .filter((page) => {
            return page.route.indexOf("2019") > 0;
          })
          .forEach((page) => {
            const pageUrl = new URL(`.${page.route}index.html`, this.context.publicDir);
            expect(fs.existsSync(pageUrl)).to.be.true;
          });
      });

      it("should have the expected pages for 2020 blog pages", function () {
        graph
          .filter((page) => {
            return page.route.indexOf("2020") > 0;
          })
          .forEach((page) => {
            const pageUrl = new URL(`.${page.route}index.html`, this.context.publicDir);
            expect(fs.existsSync(pageUrl)).to.be.true;
          });
      });

      it("should have the expected content for each blog page", function () {
        graph
          .filter((page) => {
            return page.route.indexOf(/\/blog\/[0-9]{4}/) > 0;
          })
          .forEach((page) => {
            const contents = fs.readFileSync(
              new URL(`.${page.route}index.html`, this.context.publicDir),
              "utf-8",
            );

            expect(contents).to.contain(`<p>This is the post for page ${page.data.date}.</p>`);
          });
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
