/*
 * Use Case
 * Run Greenwood with an SSR route that exports static HTML.
 *
 * User Result
 * Should generate a bare bones Greenwood build with a statically rendered from server routes.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 *  src/
 *   components/
 *     counter.js
 *     footer.js
 *   pages/
 *     artists.js
 *   layouts/
 *     app.html
 */
import chai from "chai";
import fs from "fs";
import { JSDOM } from "jsdom";
import path from "path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "A Server Rendered Application (SSR) that is statically exported";
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

    describe("Build command that tests for static HTML export from SSR route", function () {
      let dom;
      let artistsPageGraphData;

      before(async function () {
        const graph = JSON.parse(
          await fs.promises.readFile(path.join(outputPath, "public/graph.json"), "utf-8"),
        );
        const artistsHtml = await fs.promises.readFile(
          path.join(outputPath, "public/artists/index.html"),
          "utf-8",
        );

        artistsPageGraphData = graph.filter((page) => page.route === "/artists/")[0];
        dom = new JSDOM(artistsHtml);
      });

      it("should have one style tags", function () {
        const styles = dom.window.document.querySelectorAll("head > style");

        expect(styles.length).to.equal(1);
      });

      it("should have four script tags", function () {
        const scripts = Array.from(dom.window.document.querySelectorAll("head > script")).filter(
          (tag) => !tag.getAttribute("data-gwd"),
        );

        expect(scripts.length).to.equal(3);
      });

      it("should have expected SSR content from the non module script tag", function () {
        const scripts = Array.from(dom.window.document.querySelectorAll("head > script"))
          .filter((tag) => !tag.getAttribute("data-gwd"))
          .filter((tag) => !tag.getAttribute("type") && !tag.getAttribute("src"));

        expect(scripts.length).to.equal(1);
        expect(scripts[0].textContent).to.contain("console.log");
      });

      it("should have a bundled script for the footer component", function () {
        const footerScript = Array.from(
          dom.window.document.querySelectorAll("head > script[type]"),
        ).filter((script) => /footer.*[a-z0-9].js/.test(script.src));

        expect(footerScript.length).to.be.equal(1);
        expect(footerScript[0].type).to.be.equal("module");
      });

      it("should have the expected number of table rows of content", function () {
        const rows = dom.window.document.querySelectorAll("body > table tr");

        expect(rows.length).to.equal(11);
      });

      it("should have the expected <title> content in the <head>", function () {
        const title = dom.window.document.querySelectorAll("head > title");

        expect(title.length).to.equal(1);
        expect(title[0].textContent).to.equal("/artists/");
      });

      it("should have custom metadata in the <head>", function () {
        const metaDescription = Array.from(
          dom.window.document.querySelectorAll("head > meta"),
        ).filter((tag) => tag.getAttribute("name") === "description");

        expect(metaDescription.length).to.equal(1);
        expect(metaDescription[0].getAttribute("content")).to.equal(
          "/artists/ (this was generated server side!!!)",
        );
      });

      it("should be a part of graph.json", function () {
        expect(artistsPageGraphData).to.not.be.undefined;
      });

      it("should have the expected collection and order values in the graph", function () {
        expect(artistsPageGraphData.data.collection).to.equal("navigation");
        expect(artistsPageGraphData.data.order).to.equal(7);
      });

      it("should have expected custom data values in its graph data", function () {
        expect(artistsPageGraphData.data.author).to.equal("Project Evergreen");
        expect(artistsPageGraphData.data.date).to.equal("01-01-2021");
      });

      it("should append the expected <script> tag for a frontmatter import <x-counter> component", function () {
        const componentName = "counter";
        const counterScript = Array.from(
          dom.window.document.querySelectorAll("head > script[src]"),
        ).filter((tag) => tag.getAttribute("src").indexOf(`/${componentName}.`) === 0);
        const counterImport = artistsPageGraphData.imports.filter(
          (script) => script.indexOf(`${componentName}.`) >= 0,
        );

        expect(artistsPageGraphData.imports.length).to.equal(1);
        expect(counterImport.length).to.equal(1);
        expect(counterScript.length).to.equal(1);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
