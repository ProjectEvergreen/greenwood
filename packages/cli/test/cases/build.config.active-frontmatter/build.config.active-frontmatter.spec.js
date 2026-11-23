/*
 * Use Case
 * Run Greenwood with activeContent configuration enabled for validating active frontmatter.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly interpolated frontmatter variables in markdown and HTML.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   activeContent: true
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *   layouts/
 *     blog.html
 */
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { expect } from "chai";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Active Frontmatter";
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

    describe("Default Greenwood frontmatter should be interpolated in the correct places for the home page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have the correct value for the <title> tag in the <head> for the home page", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("Home");
      });

      it("should have the correct graph value for id in a <span> tag", function () {
        const id = dom.window.document.querySelector("body span.id").textContent;

        expect(id).to.be.equal("index");
      });

      it("should have the correct graph value for route in a <span> tag", function () {
        const route = dom.window.document.querySelector("body span.route").textContent;

        expect(route).to.be.equal("/");
      });

      it("should have the correct graph value for label in a <span> tag", function () {
        const label = dom.window.document.querySelector("body span.label").textContent;

        expect(label).to.be.equal("Home");
      });
    });

    describe("Simple active frontmatter should be interpolated in the correct places for the first blog post page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("blog/first-post/index.html", this.context.publicDir)),
        );
      });

      it("should have the correct value for the <title> tag in the <head> for the first post page", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("My Blog - My First Post");
      });

      it("should have the correct value for author <meta> tag in the <head>", function () {
        const authorMeta = dom.window.document
          .querySelector("head meta[name=author]")
          .getAttribute("content");

        expect(authorMeta).to.be.equal("Owen Buckley");
      });

      it("should have the correct value for published in the <h3> tag", function () {
        const heading = dom.window.document.querySelector("body h3").textContent;

        expect(heading).to.be.equal("Published: 11/11/2022");
      });

      it("should have the correct value for author in the <h4> tag", function () {
        const heading = dom.window.document.querySelector("body h4").textContent;

        expect(heading).to.be.equal("Author: Owen Buckley");
      });
    });

    describe("Rich active frontmatter should be interpolated in the correct places for the second blog post page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("blog/second-post/index.html", this.context.publicDir)),
        );
      });

      it("should have the correct value for the <title> tag in the <head> for second post page", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("My Blog - My Second Post");
      });

      it("should have the correct songs frontmatter data in the page output", function () {
        const contents = dom.window.document.querySelector("body span").innerHTML;
        const songs = JSON.parse(contents);

        expect(songs.length).to.equal(2);

        songs.forEach((song, idx) => {
          const num = (idx += 1);

          expect(song.title).to.equal(`Song ${num}`);
          expect(song.url).to.equal(`song${num}.mp3`);
        });
      });
    });

    describe("Page level custom title for the about page", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(
          fileURLToPath(new URL("about/index.html", this.context.publicDir)),
        );
      });

      it("should have the correct value for the <title> tag in the <head>", function () {
        const title = dom.window.document.querySelector("head title").textContent;

        expect(title).to.be.equal("My Custom About Page Title");
      });

      it("should have the correct content for the page", function () {
        const heading = dom.window.document.querySelector("body h1").textContent;

        expect(heading).to.be.equal("This is the about page");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
