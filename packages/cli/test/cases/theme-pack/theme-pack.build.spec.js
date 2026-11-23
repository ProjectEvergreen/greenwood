/*
 * Use Case
 * A theme pack _author_ creating a theme pack and using Greenwood for development and testing
 * following the guide published on the Greenwood website. (https://www.greenwoodjs.io/guides/theme-packs/)
 *
 * User Result
 * Should correctly validate the develop and build / serve commands work correctly using tge expected layouts
 * being resolved correctly per the known work around needs as documented in the FAQ and tracked in a discussion.
 * https://github.com/ProjectEvergreen/greenwood/discussions/682
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * Mock Theme Pack Plugin (from fixtures)
 *
 * Plugin Author Workspace
 * src/
 *   components/
 *     header.js
 *   my-layouts/
 *     blog-post.html
 *   pages/
 *     index.html
 *   styles/
 *     theme.css
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import { getDependencyFiles, getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Development environment for a Theme Pack";
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
      const themePackLayouts = await getDependencyFiles(
        new URL("src/layouts/*.html", outputUrl),
        new URL("node_modules/my-theme-pack/dist/layouts/", outputUrl),
      );
      const themePackStyles = await getDependencyFiles(
        new URL("src/styles/*.css", outputUrl),
        new URL("node_modules/my-theme-pack/dist/styles/", outputUrl),
      );
      const themePackComponents = await getDependencyFiles(
        new URL("src/components/*.js", outputUrl),
        new URL("node_modules/my-theme-pack/dist/components/", outputUrl),
      );

      await runner.setup(outputUrl, {
        setupFiles: [...themePackLayouts, ...themePackStyles, ...themePackComponents],
      });
      await runner.runCommand(cliUrl, { args: "build" });
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Custom Default App and Page Layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have expected text from layout/blog-post.html", function () {
        const pageLayoutHeading = dom.window.document.querySelectorAll("body h1")[0];

        expect(pageLayoutHeading.textContent).to.be.equal(
          "This is the blog post layout called from the layouts directory.",
        );
      });

      it("should have expected text from (test) user workspace pages/index.md", function () {
        const heading = dom.window.document.querySelectorAll("body h2")[0];
        const paragraph = dom.window.document.querySelectorAll("body p")[0];

        expect(heading.textContent).to.be.equal("Title of blog post");
        expect(paragraph.textContent).to.be.equal("Lorum Ipsum, this is a test.");
      });
    });

    describe("Custom Theme Pack theme.css in app layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should output a single CSS file for custom theme pack styles/theme.css", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("**/theme.*.css", this.context.publicDir))),
        ).to.have.lengthOf(1);
      });

      it("should have expected link tag in the head", function () {
        const linkTag = Array.from(dom.window.document.querySelectorAll("head link")).filter(
          (linkTag) => {
            return (
              linkTag.getAttribute("rel") === "stylesheet" &&
              linkTag.getAttribute("href").indexOf("/theme.") === 0
            );
          },
        );

        expect(linkTag.length).to.equal(1);
      });
    });

    describe("Custom Theme Pack heading.js in custom title page layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should output a single JS file for custom theme pack components/heading.js", async function () {
        expect(
          await glob.promise(fileURLToPath(new URL("**/header.*.js", this.context.publicDir))),
        ).to.have.lengthOf(1);
      });

      it("should have expected script tag in the head", function () {
        const scriptTags = Array.from(dom.window.document.querySelectorAll("head script"))
          .filter((tag) => !tag.getAttribute("data-gwd"))
          .filter((tag) => tag.getAttribute("src").indexOf("/header.") === 0);

        expect(scriptTags.length).to.equal(1);
      });

      it("should have expected <x-header> component", function () {
        const header = dom.window.document.querySelectorAll("body x-header");

        expect(header.length).to.equal(1);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
