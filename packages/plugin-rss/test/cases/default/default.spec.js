/*
 * Use Case
 * Run Greenwood with RSS composite plugin with default options.
 *
 * User Result
 * Should generate a bare bones Greenwood build with an RSS feed of all pages at rss.xml.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginRss } from '@greenwood/plugin-rss';
 *
 * {
 *   plugins: [
 *     greenwoodPluginRss({
 *       title: 'My Blog',
 *       link: 'https://www.myblog.dev',
 *       description: 'Musings on web development'
 *     })
 *   ]
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     blog/
 *       first-post.html
 *       second-post.html
 *     404.html
 *     index.html
 */
import fs from "node:fs/promises";
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "RSS Plugin with default options and Default Workspace";
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
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Default generated RSS feed", function () {
      let channel;
      let items;

      before(async function () {
        const feed = await fs.readFile(path.join(this.context.publicDir, "rss.xml"), "utf-8");
        const dom = new JSDOM(feed, { contentType: "text/xml" });

        channel = dom.window.document.querySelector("rss channel");
        items = Array.from(channel.querySelectorAll("item"));
      });

      it("should generate an rss.xml file with a channel", function () {
        expect(channel).to.not.equal(null);
      });

      it("should have the channel title, link, and description from the plugin options", function () {
        expect(channel.querySelector("title").textContent).to.equal("My Blog");
        expect(channel.querySelector("link").textContent).to.equal("https://www.myblog.dev");
        expect(channel.querySelector("description").textContent).to.equal(
          "Musings on web development",
        );
      });

      it("should have an item for each page except the 404 page", function () {
        const links = items.map((item) => item.querySelector("link").textContent);

        expect(items.length).to.equal(3);
        expect(links).to.not.include("https://www.myblog.dev/404/");
      });

      it("should order items by published frontmatter, newest first", function () {
        const titles = items.map((item) => item.querySelector("title").textContent);

        expect(titles).to.deep.equal(["My Second Post", "My First Post", "Home"]);
      });

      it("should build item links and guids from the link option and the page route", function () {
        expect(items[0].querySelector("link").textContent).to.equal(
          "https://www.myblog.dev/blog/second-post/",
        );
        expect(items[0].querySelector("guid").textContent).to.equal(
          "https://www.myblog.dev/blog/second-post/",
        );
      });

      it("should include an escaped description from frontmatter when present", function () {
        expect(items[1].querySelector("description").textContent).to.equal(
          "The one where it all began & more",
        );
      });

      it("should include a pubDate from published frontmatter when present", function () {
        expect(items[0].querySelector("pubDate").textContent).to.equal(
          new Date("2026-02-20").toUTCString(),
        );
      });

      it("should not include a description or pubDate for pages without frontmatter", function () {
        const homeItem = items[2];

        expect(homeItem.querySelector("description")).to.equal(null);
        expect(homeItem.querySelector("pubDate")).to.equal(null);
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
