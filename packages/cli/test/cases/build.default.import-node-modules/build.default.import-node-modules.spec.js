/*
 * Use Case
 * Run Greenwood with and loading different references to node_module types to ensure proper support.
 * Sets prerender: true to validate the functionality.
 *
 * User Result
 * Should generate a bare bones Greenwood build without erroring.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 *   styles/
 *     theme.css
 */
import chai from "chai";
import fs from "fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "path";
import { getOutputTeardownFiles, getDependencyFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, URL } from "url";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Importing packages from node modules";
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
    let dom;

    before(async function () {
      // this package has a known issue with import.meta.resolve
      // in that it has no main, module, or exports so it has to be hoisted
      // at least for this current version, as well as for testing relative ../node_modules references
      // https://unpkg.com/browse/font-awesome@4.7.0/package.json
      // https://github.com/FortAwesome/Font-Awesome/pull/19041
      const fontAwesomePackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/font-awesome/package.json`,
        `${outputPath}/node_modules/font-awesome/`,
      );
      const fontAwesomeCssFiles = await getDependencyFiles(
        `${process.cwd()}/node_modules/font-awesome/css/*`,
        `${outputPath}/node_modules/font-awesome/css/`,
      );
      const fontAwesomeFontFiles = await getDependencyFiles(
        `${process.cwd()}/node_modules/font-awesome/fonts/*`,
        `${outputPath}/node_modules/font-awesome/fonts/`,
      );

      runner.setup(outputPath, [
        ...fontAwesomePackageJson,
        ...fontAwesomeCssFiles,
        ...fontAwesomeFontFiles,
      ]);
      runner.runCommand(cliPath, "build");

      dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
    });

    describe('<script src="..."> tag in the <head> tag', function () {
      it('should have one <script src="..."> tag for main.js loaded in the <head> tag', function () {
        const scriptTags = dom.window.document.querySelectorAll("head > script[src]");
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter((script) => {
          return /main.*.js/.test(script.src);
        });

        expect(mainScriptTags.length).to.be.equal(1);
      });

      it("should have the total expected number of .js file in the output directory", async function () {
        expect(await glob.promise(path.join(this.context.publicDir, "*.js"))).to.have.lengthOf(3);
      });

      it("should have the expected main.js file in the output directory", async function () {
        expect(await glob.promise(path.join(this.context.publicDir, "main.*.js"))).to.have.lengthOf(
          1,
        );
      });
    });

    describe("<script> tag with inline code in the <head> tag", function () {
      it("should have one <script> tag with inline code loaded in the <head> tag", function () {
        const scriptTagsInline = Array.from(
          dom.window.document.querySelectorAll("head > script:not([src])"),
        ).filter((tag) => !tag.getAttribute("data-gwd"));

        expect(scriptTagsInline.length).to.be.equal(1);
      });

      it("should have the expected lit related files in the output directory", async function () {
        expect(await glob.promise(path.join(this.context.publicDir, "lit*.js"))).to.have.lengthOf(
          1,
        );
      });

      it("should have the expected inline node_modules content in the first inline script", async function () {
        const inlineScriptTag = Array.from(
          dom.window.document.querySelectorAll("head > script:not([src])"),
        ).filter((tag) => !tag.getAttribute("data-gwd"))[0];

        expect(inlineScriptTag.textContent.replace(/\n/g, "")).to.equal(
          'import"/368592136.dlaVsmnb.js";import"/lit-html.CYd3Xodq.js";//# sourceMappingURL=368592136.BFJXtrkH.js.map',
        );
      });
    });

    describe('<script src="..."> with reference to node_modules/ path in the <head> tag', function () {
      it('should have one <script src="..."> tag for lit-html loaded in the <head> tag', function () {
        const scriptTagsInline = dom.window.document.querySelectorAll("head > script[src]");
        const litScriptTags = Array.prototype.slice.call(scriptTagsInline).filter((script) => {
          return /lit-.*.js/.test(script.src);
        });

        expect(litScriptTags.length).to.be.equal(1);
      });

      it("should have the expected lit-html.js files in the output directory", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "lit-html.*.js")),
        ).to.have.lengthOf(1);
      });
    });

    describe('<link rel="stylesheet" href="..."> with reference to node_modules/ path in the <head> tag', function () {
      it('should have one <link href="..."> tag in the <head> tag', function () {
        const linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');
        const prismLinkTag = Array.prototype.slice.call(linkTags).filter((link) => {
          return /prism-tomorrow.*.css/.test(link.href);
        });

        expect(prismLinkTag.length).to.be.equal(1);
      });

      it("should have the expected prism.css file in the output directory", async function () {
        expect(
          await glob.promise(path.join(this.context.publicDir, "prism-tomorrow.*.css")),
        ).to.have.lengthOf(1);
      });
    });

    describe('<link rel="stylesheet" href="..."> with reference to node_modules with bare @import paths in the <head> tag', function () {
      it('should have one <link href="..."> tag in the <head> tag', function () {
        const linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');
        const themeLinkTag = Array.prototype.slice.call(linkTags).filter((link) => {
          return /theme.*.css/.test(link.href);
        });

        expect(themeLinkTag.length).to.be.equal(1);
      });

      it("should have the expected theme.css file in the output directory with the expected content", async function () {
        const themeFile = await glob.promise(
          path.join(this.context.publicDir, "styles/theme.*.css"),
        );
        const contents = fs.readFileSync(themeFile[0], "utf-8");

        expect(themeFile).to.have.lengthOf(1);
        expect(
          contents.indexOf(
            ":root,:host{--spectrum-global-animation-linear:cubic-bezier(0, 0, 1, 1);",
          ),
        ).to.equal(0);
      });
    });

    describe('<link rel="stylesheet" href="..."> with reference to transient relative node_modules url(...) references', function () {
      it("should have the expected number of font files referenced in vendor CSS file in the output directory", async function () {
        expect(
          await glob.promise(
            path.join(this.context.publicDir, "node-modules/font-awesome/fonts/*"),
          ),
        ).to.have.lengthOf(5);
      });

      it("should have the expected url link for the bundled font-awesome file", async function () {
        const themeFile = await glob.promise(
          path.join(this.context.publicDir, "styles/theme.*.css"),
        );
        const contents = fs.readFileSync(themeFile[0], "utf-8");

        expect(
          contents.indexOf(
            "@font-face {font-family:'FontAwesome';src:url('/node-modules/font-awesome/fonts/fontawesome-webfont.139345087.eot?v=4.7.0');",
          ) > 0,
        ).to.equal(true);
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
