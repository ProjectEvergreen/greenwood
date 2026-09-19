/*
 * Use Case
 * Run Greenwood with RSS composite plugin using the collection and maxItems options.
 *
 * User Result
 * Should generate a bare bones Greenwood build with an RSS feed of only the newest page from the blog collection.
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
 *       description: 'Musings on web development',
 *       collection: 'blog',
 *       maxItems: 1
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
  const LABEL = "RSS Plugin with collection and maxItems options and Default Workspace";
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

    describe("Collection scoped RSS feed", function () {
      let items;

      before(async function () {
        const feed = await fs.readFile(path.join(this.context.publicDir, "rss.xml"), "utf-8");
        const dom = new JSDOM(feed, { contentType: "text/xml" });

        items = Array.from(dom.window.document.querySelectorAll("rss channel item"));
      });

      it("should only include the newest item from the blog collection", function () {
        expect(items.length).to.equal(1);
        expect(items[0].querySelector("title").textContent).to.equal("My Second Post");
        expect(items[0].querySelector("link").textContent).to.equal(
          "https://www.myblog.dev/blog/second-post/",
        );
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
