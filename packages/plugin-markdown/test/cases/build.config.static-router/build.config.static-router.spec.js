/*
 * Use Case
 * Run Greenwood with staticRouter setting in Greenwood to enable SPA like routing with markdown pages.
 *
 * User Result
 * Should generate a bare bones Greenwood build with support for static router navigation.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   staticRouter: true
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     about.md
 *     index.md
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Build Greenwood With: ", function () {
  const LABEL = "Static Router Configuration and Markdown pages";
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

    describe("Static content routes", function () {
      let dom;
      let aboutDom;
      let pages;
      let partials;
      let routerFiles;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
        aboutDom = await JSDOM.fromFile(
          fileURLToPath(new URL("about/index.html", this.context.publicDir)),
        );
        pages = await glob(fileURLToPath(new URL("*.html", this.context.publicDir)));
        partials = await glob(fileURLToPath(new URL("_routes/**/*.html", this.context.publicDir)));
        routerFiles = await glob(fileURLToPath(new URL("router.*.js", this.context.publicDir)));
      });

      it("should have one <script> tag in the <head> for the router", function () {
        const scriptTags = dom.window.document.querySelectorAll("head > script[type]");

        expect(scriptTags.length).to.be.equal(1);
        expect(scriptTags[0].href).to.contain(/router.*.js/);
        expect(scriptTags[0].type).to.be.equal("module");
      });

      it("should have one router.js file in the output directory", function () {
        expect(routerFiles.length).to.be.equal(1);
      });

      it("should have one expected inline <script> tag in the <head> for router global variables", function () {
        const inlineRouterTags = Array.from(
          dom.window.document.querySelectorAll("head > script"),
        ).filter((tag) => tag.getAttribute("data-gwd") === "static-router");

        expect(inlineRouterTags.length).to.be.equal(1);
        expect(inlineRouterTags[0].textContent).to.contain(
          "globalThis.__greenwood = globalThis.__greenwood || {};",
        );
        expect(inlineRouterTags[0].textContent).to.contain(
          'globalThis.__greenwood.currentLayout = "page"',
        );
      });

      it("should have one <router-outlet> tag in the <body> for the content", function () {
        const routerOutlets = dom.window.document.querySelectorAll("body > router-outlet");

        expect(routerOutlets.length).to.be.equal(1);
      });

      it("should have expected <greenwood-route> tags in the <body> for each page", function () {
        const routeTags = dom.window.document.querySelectorAll("body > greenwood-route");

        expect(routeTags.length).to.be.equal(2);
      });

      it("should have the expected properties for each <greenwood-route> tag for the about page", function () {
        const aboutRouteTag = Array.from(
          dom.window.document.querySelectorAll("body > greenwood-route"),
        ).filter((tag) => tag.dataset.route === "/about/");
        const dataset = aboutRouteTag[0].dataset;

        expect(aboutRouteTag.length).to.be.equal(1);
        expect(dataset.layout).to.be.equal("test");
        expect(dataset.key).to.be.equal("/_routes/about/index.html");
      });

      it("should have the expected properties for each <greenwood-route> tag for the home page", function () {
        const aboutRouteTag = Array.from(
          dom.window.document.querySelectorAll("body > greenwood-route"),
        ).filter((tag) => tag.dataset.route === "/");
        const dataset = aboutRouteTag[0].dataset;

        expect(aboutRouteTag.length).to.be.equal(1);
        expect(dataset.layout).to.be.equal("page");
        expect(dataset.key).to.be.equal("/_routes/index.html");
      });

      // tests to make sure we filter out 404 page from _route partials
      it("should have the expected top level HTML files (index.html) in the output", function () {
        expect(pages.length).to.equal(1);
      });

      it("should have the expected number of _route partials in the output directory for each page", function () {
        expect(partials.length).to.be.equal(2);
      });

      it("should have the expected partial output to match the contents of the home page in the <router-outlet> tag in the <body>", function () {
        const aboutPartial = fs.readFileSync(
          new URL("_routes/about/index.html", this.context.publicDir),
          "utf-8",
        );
        const aboutRouterOutlet =
          aboutDom.window.document.querySelectorAll("body > router-outlet")[0];

        expect(aboutRouterOutlet.innerHTML.replace(/\n/g, "").trim()).to.contain(
          aboutPartial.replace("<body>", "").replace("</body>", "").replace(/\n/g, "").trim(),
        );
      });

      it("should have the expected partial output to match the contents of the about page in the <router-outlet> tag in the <body>", function () {
        const homePartial = fs.readFileSync(
          new URL("_routes/index.html", this.context.publicDir),
          "utf-8",
        );
        const homeRouterOutlet = dom.window.document.querySelectorAll("body > router-outlet")[0];

        expect(homeRouterOutlet.innerHTML.replace(/\n/g, "").trim()).to.contain(
          homePartial.replace("<body>", "").replace("</body>", "").replace(/\n/g, "").trim(),
        );
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
