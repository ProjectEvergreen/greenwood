/*
 * Use Case
 * Independently configure browser prerendering and static HTML export for SSR routes.
 *
 * User Result
 * Prerendering executes the app layout for deeply rendered header and supports request-time server rendering.
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Independent SSR prerender and static export options";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const hostname = "http://127.0.0.1:8080";
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const publicDir = new URL("./public/", import.meta.url);
  let runner;

  before(function () {
    runner = new Runner();
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

    it("should only emit HTML files for static export routes", async function () {
      const htmlFiles = await Array.fromAsync(fs.glob("*/index.html", { cwd: publicDir }));

      expect(htmlFiles).to.have.members([
        path.join("prerender-static-export", "index.html"),
        path.join("static-export", "index.html"),
      ]);
    });

    it("should only emit SSR bundles for runtime routes", async function () {
      const routeBundles = await Array.fromAsync(fs.glob("*.route.*.js", { cwd: publicDir }));

      expect(routeBundles.some((file) => file.startsWith("default.route."))).to.equal(true);
      expect(routeBundles.some((file) => file.startsWith("prerender.route."))).to.equal(true);
      expect(routeBundles.some((file) => file.startsWith("static-export.route."))).to.equal(false);
      expect(
        routeBundles.some((file) => file.startsWith("prerender-static-export.route.")),
      ).to.equal(false);
    });

    it("should preserve request-time rendering without prerendering the app shell", async function () {
      const response = await fetch(`${hostname}/default/?value=request-time`);
      const dom = new JSDOM(await response.text());

      expect(dom.window.document.querySelector("body > h1").textContent).to.equal(
        "default: request-time",
      );
      expect(dom.window.document.querySelectorAll("app-header > p").length).to.equal(0);
    });

    it("should prerender the app shell while preserving request-time SSR", async function () {
      const response = await fetch(`${hostname}/prerender/?value=request-time`);
      const dom = new JSDOM(await response.text());

      expect(dom.window.document.querySelector("body > h1").textContent).to.equal(
        "prerender: request-time",
      );
      expect(dom.window.document.querySelector("app-header > p").textContent).to.equal(
        "Prerendered app header",
      );
      expect(dom.window.document.querySelectorAll('script[src*="header"]').length).to.equal(0);
    });

    it("should statically export an SSR route without prerendering its app shell", async function () {
      const response = await fetch(`${hostname}/static-export/`);
      const dom = new JSDOM(await response.text());

      expect(dom.window.document.querySelector("body > h1").textContent).to.equal(
        "static export: build",
      );
      expect(dom.window.document.querySelectorAll("app-header > p").length).to.equal(0);
    });

    it("should prerender and statically export the same SSR route", async function () {
      const response = await fetch(`${hostname}/prerender-static-export/`);
      const dom = new JSDOM(await response.text());

      expect(dom.window.document.querySelector("body > h1").textContent).to.equal(
        "prerender and static export: build",
      );
      expect(dom.window.document.querySelector("app-header > p").textContent).to.equal(
        "Prerendered app header",
      );
      expect(dom.window.document.querySelectorAll('script[src*="header"]').length).to.equal(0);
    });

    it("should keep rendering options out of custom page data", async function () {
      const graph = JSON.parse(await fs.readFile(new URL("./graph.json", publicDir), "utf-8"));
      const staticExportPage = graph.find((page) => page.route === "/static-export/");

      expect(staticExportPage.staticExport).to.equal(true);
      expect(staticExportPage.data.staticExport).to.equal(undefined);
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
