/*
 * Use Case
 * Run Greenwood develop with prerendering enabled for a single page application.
 *
 * User Result
 * Should prerender the SPA shell for root and fallback routes while preserving custom response status and headers.
 * Should leave HTML API responses and standalone HTML assets outside SPA prerendering.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * { prerender: true } with a custom resource plugin serving HTML responses for
 * /api/fragment, /created/, and /assets/fragment.html.
 *
 * User Workspace
 * src/
 *   assets/
 *     fragment.html
 *   components/
 *     header.js
 *   index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "SPA Prerendering";
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

    describe("Root SPA route", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/`, { headers: { Accept: "text/html" } });
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should prerender the SPA shell and retain live reload", function () {
        expect(dom.window.document.querySelector("app-header header").textContent).to.equal(
          "Prerendered SPA shell",
        );
        expect(dom.window.document.querySelector('script[src="./components/header.js"]')).to.equal(
          null,
        );
        expect(
          dom.window.document.querySelectorAll('script[src*="/livereload.js"]'),
        ).to.have.length(1);
      });
    });

    describe("Fallback SPA route", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/nested/client/route/`, {
          headers: { Accept: "text/html" },
        });
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should prerender the SPA shell and retain live reload", function () {
        expect(dom.window.document.querySelector("app-header header").textContent).to.equal(
          "Prerendered SPA shell",
        );
        expect(dom.window.document.querySelector('script[src="./components/header.js"]')).to.equal(
          null,
        );
        expect(
          dom.window.document.querySelectorAll('script[src*="/livereload.js"]'),
        ).to.have.length(1);
      });
    });

    describe("Custom HTML page response", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/created/`, { headers: { Accept: "text/html" } });
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 201 status", function () {
        expect(response.status).to.equal(201);
      });

      it("should preserve the response status text and custom headers", function () {
        expect(response.statusText).to.equal("Created");
        expect(response.headers.get("X-Custom-Header")).to.equal("preserved");
      });

      it("should prerender the custom HTML response", function () {
        expect(dom.window.document.querySelector("app-header header").textContent).to.equal(
          "Prerendered SPA shell",
        );
      });
    });

    describe("HTML API response", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/api/fragment`, { headers: { Accept: "text/html" } });
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should leave the response outside SPA prerendering", function () {
        expect(dom.window.document.querySelector("app-header").innerHTML).to.equal("");
        expect(
          dom.window.document.querySelector('script[src="/components/header.js"]'),
        ).not.to.equal(null);
      });
    });

    describe("Standalone HTML asset", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/assets/fragment.html`, {
          headers: { Accept: "text/html" },
        });
        const body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should leave the response outside SPA prerendering", function () {
        expect(dom.window.document.querySelector("app-header").innerHTML).to.equal("");
        expect(
          dom.window.document.querySelector('script[src="/components/header.js"]'),
        ).not.to.equal(null);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
