/*
 * Use Case
 * Run Greenwood build command with no config and custom page layout.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom page layout.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   scripts
 *     main.js
 *   styles/
 *     theme.css
 *   layouts/
 *     page.html
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles, HASH_REGEX } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Greenwood Configuration and Workspace w/Custom Page Layout";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
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

    describe("Custom Page Layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      describe("correct merge order for default app and custom page layout <head> tags", function () {
        let scriptTags;
        let linkTags;
        let styleTags;

        before(function () {
          scriptTags = Array.from(
            dom.window.document.querySelectorAll('head script[type="module"]'),
          ).filter((tag) => !tag.getAttribute("data-gwd"));
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');
          styleTags = dom.window.document.querySelectorAll("head > style");
        });

        it("should have custom <meta> tag in the <head>", function () {
          const customMeta = Array.from(dom.window.document.querySelectorAll("head > meta")).filter(
            (meta) => meta.getAttribute("property") === "og:description",
          );

          expect(customMeta.length).to.be.equal(1);
          expect(customMeta[0].getAttribute("content")).to.be.equal("My custom meta content.");
        });

        it("should have 1 <script> tags in the <head>", function () {
          expect(scriptTags.length).to.equal(1);
        });

        it("should have 1 <link> tags in the <head>", function () {
          expect(linkTags.length).to.equal(1);
        });

        it("should have 1 <style> tag in the <head>", function () {
          expect(styleTags.length).to.equal(1);
        });

        it("should add one page layout <script> tag", function () {
          expect(scriptTags[0].type).to.equal("module");
          expect(scriptTags[0].src).to.match(/main.*.js/);
        });

        it("should add one page layout <link> tag", function () {
          expect(linkTags[0].rel).to.equal("stylesheet");
          expect(linkTags[0].href).to.match(new RegExp(`/styles/theme.${HASH_REGEX}.css`));
        });

        it("should add one page layout <style> tag", function () {
          expect(styleTags[0].textContent).to.contain(".owen-test");
        });
      });

      describe("custom inline <style> tag in the <head> of a page layout", function () {
        let dom;

        before(async function () {
          dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
        });

        it("should have the specific element we added as part of our custom page layout", function () {
          const customElement = dom.window.document.querySelectorAll("div.owen-test");

          expect(customElement.length).to.equal(1);
        });

        it("should have the color style for the .owen-test element in the page layout that we added as part of our custom style", function () {
          const customElement = dom.window.document.querySelector(".owen-test");
          const computedStyle = dom.window.getComputedStyle(customElement);

          expect(computedStyle.color).to.equal("blue");
        });

        it("should have the color styles for the h3 element that we defined as part of our custom style", function () {
          const customHeader = dom.window.document.querySelector("h3");
          const computedStyle = dom.window.getComputedStyle(customHeader);

          expect(computedStyle.color).to.equal("green");
        });
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
