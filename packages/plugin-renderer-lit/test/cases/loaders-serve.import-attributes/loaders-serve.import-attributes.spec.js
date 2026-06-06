/*
 * Use Case
 * Run Greenwood build command with a static site and only prerendering the content (no JS!) and using import attributes
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly templated out HTML from a LitElement.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';
 *
 * {
 *   plugins: [
 *     greenwoodPluginRendererLit()
 *   ]
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     card/
 *       card.js
 *       card.css
 *   pages/
 *     api/
 *       fragment.js
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With Custom Lit Renderer for SSR: ", function () {
  const LABEL = "For SSR with Import Attributes";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner(false, true);
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "serve", {
            onStdOut: (message) => {
              if (message.includes("Started server at http://localhost:8080")) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Serve command with API route server rendering LitElement <app-card> components as an HTML response with import attributes", function () {
      let resp;
      let html;
      let dom;

      before(async function () {
        resp = await fetch(`${hostname}/api/fragment`);
        html = await resp.text();
        dom = new JSDOM(html);
      });

      it("should have a response status of 200", function (done) {
        expect(resp.status).to.equal(200);

        done();
      });

      it("should have a Content-Type header of text/html", function (done) {
        const type = resp.headers.get("Content-Type");

        expect(type).to.equal("text/html");

        done();
      });

      it("should have the expected number of <app-card> components for a single search result", function (done) {
        const cards = dom.window.document.querySelectorAll(
          'app-card template[shadowrootmode="open"]',
        );
        const cardDom = new JSDOM(cards[0].innerHTML);

        expect(cards.length).to.equal(1);
        // TODO this should be using real data from attributes (see issue with static in card.js)
        expect(cardDom.window.document.querySelectorAll("h3")[0].textContent).to.equal(
          "1) Product 1",
        );
        expect(cardDom.window.document.querySelectorAll("img")[0].getAttribute("src")).to.equal(
          "product1.png",
        );

        done();
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
