/*
 * Use Case
 * Run Greenwood build command with default setting for optimization
 *
 * User Result
 * Should generate a Greenwood build that preloads all <script> and <link> tags
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   foo/
 *     bar.baz
 *   images/
 *     webcomponents.jpg
 *   pages/
 *     index.html
 *   styles/
 *     main.css
 *     theme.css
 *   system
 *     variables.css
 */
import chai from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getDependencyFiles, getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { HASH_REGEX } from "../../../src/lib/hashing-utils.js";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Default Optimization Configuration";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const expectedCss = fs
    .readFileSync(path.join(outputPath, "./fixtures/expected.css"), "utf-8")
    .replace(/\n/g, "");
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      // this package has a known issue with import.meta.resolve
      // if this gets fixed, we can remove the need for this setup
      // https://github.com/vercel/geist-font/issues/150
      const geistPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/geist/package.json`,
        `${outputPath}/node_modules/geist/`,
      );
      const geistFonts = await getDependencyFiles(
        `${process.cwd()}/node_modules/geist/dist/fonts/geist-sans/*`,
        `${outputPath}/node_modules/geist/dist/fonts/geist-sans/`,
      );

      await runner.setup(outputPath, [...geistPackageJson, ...geistFonts]);
      await runner.runCommand(cliPath, "build");
    });

    describe("Output for JavaScript / CSS tags and files", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
      });

      describe("<script> tag and preloading", function () {
        it("should contain one javascript file in the output directory", async function () {
          expect(await glob.promise(path.join(this.context.publicDir, "*.js"))).to.have.lengthOf(1);
        });

        it("should have the expected <script> tag in the <head>", function () {
          const scriptTags = Array.from(
            dom.window.document.querySelectorAll('head script[type="module"]'),
          ).filter((tag) => !tag.getAttribute("data-gwd"));

          expect(scriptTags.length).to.be.equal(1);
        });

        it("should have the expect modulepreload <link> tag for the same <script> tag src in the <head>", function () {
          const preloadScriptTags = Array.from(
            dom.window.document.querySelectorAll('head link[rel="modulepreload"]'),
          ).filter((link) => link.getAttribute("as") === "script");

          expect(preloadScriptTags.length).to.be.equal(1);
          expect(preloadScriptTags[0].href).to.match(/header.*.js/);
        });
      });

      describe("<link> tag and preloading", function () {
        it("should contain one style.css in the output directory", async function () {
          expect(
            await glob.promise(`${path.join(this.context.publicDir, "styles")}/main.*.css`),
          ).to.have.lengthOf(1);
        });

        it("should have the expected <link> tag in the <head>", function () {
          const linkTags = Array.from(
            dom.window.document.querySelectorAll('head link[rel="preload"]'),
          ).filter((tag) => tag.getAttribute("as") === "style");

          expect(linkTags.length).to.be.equal(1);
        });

        it("should have the expect preload <link> tag for the same <link> tag href in the <head>", function () {
          const preloadLinkTags = Array.from(
            dom.window.document.querySelectorAll('head link[rel="preload"]'),
          ).filter((link) => link.getAttribute("as") === "style");

          expect(preloadLinkTags.length).to.be.equal(1);
          expect(preloadLinkTags[0].href).to.match(/\/styles\/main.*.css/);
          expect(preloadLinkTags[0].getAttribute("crossorigin")).to.equal("anonymous");
        });

        // test custom CSS bundling
        it("should have the expect preload CSS content in the file", async function () {
          const cssFiles = await glob.promise(path.join(this.context.publicDir, "styles/*.css"));
          const customCss = await fs.promises.readFile(cssFiles[0], "utf-8");

          expect(cssFiles.length).to.be.equal(1);
          const regex = HASH_REGEX.replace("{8}", "{8,10}");
          const normalizeCss = (css) =>
            css
              .replace(
                new RegExp(`webcomponents\\.${regex}\\.jpg`, "g"),
                "webcomponents.[HASH].jpg",
              )
              .replace(new RegExp(`bar\\.${regex}\\.baz`, "g"), "bar.[HASH].baz");

          const normalizedCustomCss = normalizeCss(customCss);
          const normalizedExpectedCss = normalizeCss(expectedCss);

          expect(normalizedCustomCss).to.be.equal(normalizedExpectedCss);
        });
      });

      describe("<style> tags on the page", function () {
        it("should have the expected inline content for prism.css @import in the <style> tag in the <head>", function () {
          const headStyleTags = Array.from(dom.window.document.querySelectorAll("head style"));

          expect(headStyleTags.length).to.be.equal(1);
          expect(headStyleTags[0].textContent.indexOf("code[class*='language-']")).to.equal(0);
        });

        it("should have the expected contents of the <style> tag in the <body>", async function () {
          const styleTags = Array.from(dom.window.document.querySelectorAll("body style"));

          expect(styleTags.length).to.equal(1);
          expect(styleTags[0].textContent.replace(/\n/g, "")).to.equal(
            "*{color:red;font-size:blue;}",
          );
        });
      });

      describe("bundled URL references in CSS files", function () {
        describe("node modules reference", () => {
          const fontPath = "node-modules/geist/dist/fonts/geist-sans";
          let dom;

          before(async function () {
            dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "./index.html"));
          });

          it("should have the expected @font-face file from node_modules copied into the output directory", async function () {
            expect(
              await glob.promise(path.join(this.context.publicDir, `${fontPath}/*.woff2`)),
            ).to.have.lengthOf(1);
          });

          it("should have the expected @font-face file bundle path in the referenced <style> tag in index.html", async function () {
            const styleTag = Array.from(dom.window.document.querySelectorAll("head style"));

            expect(styleTag[0].textContent.replace(/\s+/g, "")).to.match(
              new RegExp(`src:url\\('/${fontPath}/Geist-Regular\\.${HASH_REGEX}\\.woff2'\\)`),
            );
          });
        });

        describe("user workspace reference", () => {
          const imagePath = `images/webcomponents.*.jpg`;

          it("should have the expected background image from the user's workspace the output directory", async function () {
            expect(
              await glob.promise(path.join(this.context.publicDir, imagePath)),
            ).to.have.lengthOf(1);
          });

          it("should have the expected @font-face file bundle path in the referenced <style> tag in index.html", async function () {
            const mainCss = await glob.promise(
              `${path.join(this.context.publicDir, "styles")}/main.*.css`,
            );
            const contents = await fs.promises.readFile(mainCss[0], "utf-8");

            expect(contents.replace(/\s+/g, "")).to.match(
              new RegExp(
                `body\\{background-color:green;background-image:url\\('/images/webcomponents\\.${HASH_REGEX}\\.jpg'\\);\\}`,
              ),
            );
          });
        });

        describe("inline scratch dir workspace reference", () => {
          const imagePath = `images/link.*.png`;

          it("should have the expected background image from the user's workspace the output directory", async function () {
            expect(
              await glob.promise(path.join(this.context.publicDir, imagePath)),
            ).to.have.lengthOf(1);
          });

          it("should have the expected background-image url file bundle path in the referenced <style> tag in index.html", async function () {
            const styleTag = Array.from(dom.window.document.querySelectorAll("head style"));
            expect(styleTag[0].textContent).to.match(
              new RegExp(
                `html\\{background-image:url\\('/images/link\\.${HASH_REGEX}\\.png'\\)\\}`,
              ),
            );
          });
        });

        describe("absolute user workspace reference", () => {
          const resourcePath = `foo/bar.*.baz`;

          it("should have the expected resource reference from the user's workspace in the output directory", async function () {
            expect(
              await glob.promise(path.join(this.context.publicDir, resourcePath)),
            ).to.have.lengthOf(1);
          });
        });
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
