/*
 * Use Case
 * Build with Greenwood when using a custom context plugin (e.g. installed via npm) that provides custom layouts (app / page) and resources (JS / CSS); aka a "theme pack".
 *
 * User Result
 * Should generate a bare bones Greenwood build with expected layouts being used from node_modules along with JS and CSS.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * Mock Theme Pack Plugin (from fixtures)
 *
 * Custom Workspace
 * src/
 *   pages/
 *     slides/
 *       index.md
 *     about-me.md
 *     index.md
 */
import chai from "chai";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getDependencyFiles, getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Context Plugin and Default Workspace (aka Theme Packs)";
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
      // copy fixtures into node_modules
      // to match the location specified in the plugin under test
      const themePackLayouts = await getDependencyFiles(
        `${outputPath}/fixtures/my-layouts/*.html`,
        `${outputPath}/node_modules/my-theme-pack/dist/my-layouts`,
      );
      const themePackStyles = await getDependencyFiles(
        `${outputPath}/fixtures/styles/*.css`,
        `${outputPath}/node_modules/my-theme-pack/dist/styles`,
      );
      const themePackComponents = await getDependencyFiles(
        `${outputPath}/fixtures/components/*.js`,
        `${outputPath}/node_modules/my-theme-pack/dist/components`,
      );

      runner.setup(outputPath, [...themePackLayouts, ...themePackStyles, ...themePackComponents]);
      runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("App and Custom Index Page Layouts for the home page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
      });

      it("should have expected text from from a mock package layout/app.html in node_modules/", function () {
        const pageLayoutHeading = dom.window.document.querySelectorAll("body h1")[0];

        expect(pageLayoutHeading.textContent).to.be.equal(
          "This is a custom app layout from the custom layouts directory.",
        );
      });

      it("should have expected <body> content from the index layout", function () {
        const customElement = dom.window.document.querySelectorAll("body presenter-mode");

        expect(customElement.length).to.equal(1);
      });

      it("should have expected <head> content from the index layout", function () {
        const scriptTags = dom.window.document.querySelectorAll("head script");
        const tags = Array.from(scriptTags).filter((tag) => tag.getAttribute("type") === "module");

        expect(tags.length).to.equal(1);
      });

      it("should NOT have any content from the index page since index layout has no <content-outlet></content-outlet> tag", function () {
        const h3 = dom.window.document.querySelectorAll("body h3");
        const h4 = dom.window.document.querySelectorAll("body h4");

        expect(h3.length).to.equal(0);
        expect(h4.length).to.equal(0);
      });
    });

    describe("Default App and Page Layouts for the about page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "about-me/index.html"));
      });

      it("should have expected text from from a mock package layout/app.html in node_modules/", function () {
        const pageLayoutHeading = dom.window.document.querySelectorAll("body h1")[0];

        expect(pageLayoutHeading.textContent).to.be.equal(
          "This is a custom app layout from the custom layouts directory.",
        );
      });

      it("should have expected text from from a mock package layout/page.html in node_modules/", function () {
        const pageLayoutHeading = dom.window.document.querySelectorAll("body h2")[0];

        expect(pageLayoutHeading.textContent).to.be.equal(
          "This is a custom (default) page layout from the custom layouts directory.",
        );
      });

      it("should have expected text from user workspace pages/index.md", function () {
        const pageHeadingPrimary = dom.window.document.querySelectorAll("body h3")[0];
        const pageHeadingSecondary = dom.window.document.querySelectorAll("body p")[0];

        expect(pageHeadingPrimary.textContent).to.be.equal("About Me");
        expect(pageHeadingSecondary.textContent).to.be.equal("Hello from me!");
      });
    });

    describe("Custom Title Page Layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "slides/index.html"));
      });

      it("should have expected text from from a mock package layout/app.html in node_modules/", function () {
        const pageLayoutHeading = dom.window.document.querySelectorAll("body h1")[0];

        expect(pageLayoutHeading.textContent).to.be.equal(
          "This is a custom app layout from the custom layouts directory.",
        );
      });

      it("should have expected text from from a mock package layout/title.html in node_modules/", function () {
        const pageLayoutHeading = dom.window.document.querySelectorAll("body h2")[0];

        expect(pageLayoutHeading.textContent).to.be.equal(
          "This is a custom page layout called title from the layouts directory.",
        );
      });

      it("should have expected text from user workspace pages/index.md", function () {
        const pageHeadingPrimary = dom.window.document.querySelectorAll("body h3")[0];
        const pageHeadingSecondary = dom.window.document.querySelectorAll("body h4")[0];

        expect(pageHeadingPrimary.textContent).to.be.equal("Title Page");
        expect(pageHeadingSecondary.textContent).to.be.equal("Some content from title.md.");
      });
    });

    describe("Custom Theme Pack theme.css in app layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
      });

      it("should output a single CSS file for custom theme pack styles/theme.css", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "**/theme.*.css")),
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

    describe("Custom Theme Pack greeting.js in custom title page layout", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "slides/index.html"));
      });

      it("should output a single JS file for custom theme pack components/greeting.js", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "**/greeting.*.js")),
        ).to.have.lengthOf(1);
      });

      it("should have expected link tag in the head", function () {
        const scriptTag = Array.from(
          dom.window.document.querySelectorAll('head script[type="module"]'),
        )
          .filter((tag) => !tag.getAttribute("data-gwd"))
          .filter((tag) => tag.getAttribute("src").indexOf("/greeting.") === 0);

        expect(scriptTag.length).to.equal(1);
      });

      it("should have expected <x-greeting> component", function () {
        const greetingComponent = dom.window.document.querySelectorAll("body x-greeting");

        expect(greetingComponent.length).to.equal(1);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
