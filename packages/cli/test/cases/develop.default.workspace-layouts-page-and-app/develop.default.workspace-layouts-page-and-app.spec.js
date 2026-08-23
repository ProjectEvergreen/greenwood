/*
 * Use Case
 * Run Greenwood develop command with an app layout, a page layout, and a page that all
 * reference the same <script src> and <link href> resources.
 *
 * User Result
 * Should start the development server and serve HTML in which each shared resource tag
 * is only emitted once.
 * https://github.com/ProjectEvergreen/greenwood/issues/1760
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   layouts/
 *     app.html
 *     page.html
 *   pages/
 *     index.html
 *   scripts/
 *     app-layout.js
 *     page-layout.js
 *     shared.js
 *   styles/
 *     app-layout.css
 *     page-layout.css
 *     shared.css
 * package.json
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Default Workspace w/ App Layout, Page Layout and Page Sharing Resources";
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
    let response = {};
    let dom;

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

      response = await fetch(`${hostname}:${port}/`, {
        headers: {
          accept: "text/html",
        },
      });

      dom = new JSDOM(await response.clone().text());
    });

    describe("Develop command specific HTML behaviors", function () {
      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.contain("text/html");
      });

      it("should return a 200", function () {
        expect(response.status).to.equal(200);
      });

      it("should have the expected heading tag from the page in the <body>", function () {
        const headings = dom.window.document.querySelectorAll("body h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("Default home page");
      });

      it("should merge page layout <script> tags after app layout <script> tags", function () {
        // filter out the dev server's own livereload <script> tag
        const scriptTags = Array.from(
          dom.window.document.querySelectorAll("head > script[src]"),
        ).filter((tag) => tag.getAttribute("src").startsWith("/scripts/"));

        expect(scriptTags.length).to.equal(3);
        expect(scriptTags[0].getAttribute("src")).to.equal("/scripts/app-layout.js");
        expect(scriptTags[1].getAttribute("src")).to.equal("/scripts/shared.js");
        expect(scriptTags[2].getAttribute("src")).to.equal("/scripts/page-layout.js");
      });

      it("should merge page layout <link> tags after app layout <link> tags", function () {
        const linkTags = Array.from(
          dom.window.document.querySelectorAll('head > link[rel="stylesheet"]'),
        );

        expect(linkTags.length).to.equal(3);
        expect(linkTags[0].getAttribute("href")).to.equal("/styles/app-layout.css");
        expect(linkTags[1].getAttribute("href")).to.equal("/styles/shared.css");
        expect(linkTags[2].getAttribute("href")).to.equal("/styles/page-layout.css");
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1760
    describe("a shared resource referenced by the app layout, page layout, and page", function () {
      it("should emit the shared <script> tag only once", function () {
        const sharedScripts = Array.from(
          dom.window.document.querySelectorAll('script[src="/scripts/shared.js"]'),
        );

        expect(sharedScripts.length).to.equal(1);
      });

      it("should emit the shared stylesheet <link> tag only once", function () {
        const sharedLinks = Array.from(
          dom.window.document.querySelectorAll('link[href="/styles/shared.css"]'),
        );

        expect(sharedLinks.length).to.equal(1);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
