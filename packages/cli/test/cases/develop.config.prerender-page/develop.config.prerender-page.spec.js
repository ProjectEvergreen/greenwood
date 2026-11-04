/*
 * Use Case
 * Run Greenwood develop with project prerendering disabled and individual HTML and SSR pages opting in.
 *
 * User Result
 * Should prerender opted-in pages, remove static scripts, and retain inline optimization overrides.
 * Should keep other pages client rendered, including routes that only enable staticExport.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * {
 *   prerender: false,
 *   activeContent: true,
 *   optimization: 'static'
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     client.js
 *     header.js
 *   layouts/
 *     app.html
 *   pages/
 *     enabled.html
 *     index.html
 *     ssr.js
 *     static-only.js
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Page-level Prerendering";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://127.0.0.1:1984";
  let runner;

  before(function () {
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes("Started local development server at http://localhost:1984")) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Default HTML page", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should leave rendering to the browser and retain the component script", function () {
        expect(dom.window.document.querySelector("app-header").innerHTML).to.equal("");
        expect(
          dom.window.document.querySelector('script[src="/components/header.js"]'),
        ).not.to.equal(null);
      });
    });

    describe("SSR page with only static export enabled", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/static-only/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should leave rendering to the browser and retain the component script", function () {
        expect(dom.window.document.querySelector("app-header").innerHTML).to.equal("");
        expect(
          dom.window.document.querySelector('script[src="/components/header.js"]'),
        ).not.to.equal(null);
      });
    });

    describe("HTML page opting in through frontmatter", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/enabled/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should prerender the component and remove its static script", function () {
        expect(dom.window.document.querySelector("app-header header").textContent).to.equal(
          "Page prerendering",
        );
        expect(dom.window.document.querySelector('script[src="/components/header.js"]')).to.equal(
          null,
        );
      });

      it("should retain inline optimization overrides, framework scripts, and page data", function () {
        expect(
          dom.window.document.querySelector('script[src="/components/client.js"]'),
        ).not.to.equal(null);
        expect(
          dom.window.document.querySelectorAll('script[src*="/livereload.js"]'),
        ).to.have.length(1);
        expect(dom.window.document.querySelectorAll('script[data-gwd="base-path"]')).to.have.length(
          1,
        );
        expect(dom.window.document.querySelectorAll('script[type="importmap"]')).to.have.length(1);
        expect(
          JSON.parse(dom.window.document.querySelector("script#page-data").textContent),
        ).to.deep.equal({ value: 42 });
      });
    });

    describe("SSR page opting in through its export", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/ssr/`);
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should prerender the component and remove its static script", function () {
        expect(dom.window.document.querySelector("app-header header").textContent).to.equal(
          "Page prerendering",
        );
        expect(dom.window.document.querySelector('script[src="/components/header.js"]')).to.equal(
          null,
        );
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
