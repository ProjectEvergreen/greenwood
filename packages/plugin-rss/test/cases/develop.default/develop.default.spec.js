/*
 * Use Case
 * Run Greenwood develop command with RSS composite plugin.
 *
 * User Result
 * Should start the development server and serve the generated RSS feed at rss.xml.
 *
 * User Command
 * greenwood develop
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
 *     index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "RSS Plugin with default options and Default Workspace";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1984;
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes(`Started local development server at http://localhost:1984`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Develop command specific rss.xml behaviors", function () {
      let response = {};
      let items;

      before(async function () {
        response = await fetch(`${hostname}:${port}/rss.xml`);

        const feed = await response.text();
        const dom = new JSDOM(feed, { contentType: "text/xml" });

        items = Array.from(dom.window.document.querySelectorAll("rss channel item"));
      });

      it("should return a 200", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("application/rss+xml");
      });

      it("should return the generated RSS feed with an item for each page", function () {
        const titles = items.map((item) => item.querySelector("title").textContent);

        expect(items.length).to.equal(2);
        expect(titles).to.deep.equal(["My First Post", "Home"]);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown([path.join(outputPath, ".greenwood")]);
  });
});
