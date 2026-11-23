/*
 * Use Case
 * Run Greenwood build command for a dynamic route whose getStaticPaths returns a value that
 * resolves to the same route as an existing static page.
 *
 * User Result
 * Should preserve the existing page's output for colliding routes and still generate
 * the dynamic route's other static paths.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * N / A
 *
 * User Workspace
 * src/
 *   pages/
 *     [slug].js
 *     about.html
 *     index.html
 *     exported.js
 *     runtime.js
 *     café.html
 *     hello world.html
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

// https://github.com/ProjectEvergreen/greenwood/issues/1768
describe("Build Greenwood With: ", function () {
  const LABEL = "A getStaticPaths value that collides with an existing static page";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const encodedSlugs = ["café", "hello world"];
  const runner = new Runner();

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    for (const slug of encodedSlugs) {
      it(`should preserve the static page output for the encoded route ${slug}`, async function () {
        const html = await fs.readFile(
          new URL(`./public/${encodeURIComponent(slug)}/index.html`, import.meta.url),
          "utf-8",
        );
        const dom = new JSDOM(html);

        expect(dom.window.document.querySelector("body > h1").textContent).to.equal(
          `Static Page: ${slug}`,
        );
      });
    }

    it("should preserve a statically exported SSR page over a static path", async function () {
      const html = await fs.readFile(
        new URL("./public/exported/index.html", import.meta.url),
        "utf-8",
      );
      const dom = new JSDOM(html);

      expect(dom.window.document.querySelector("body > h1").textContent).to.equal(
        "Exported SSR Page",
      );
    });

    it("should still emit a static path overlapping a request-time SSR route", async function () {
      const html = await fs.readFile(
        new URL("./public/runtime/index.html", import.meta.url),
        "utf-8",
      );
      const dom = new JSDOM(html);

      expect(dom.window.document.querySelector("body > h1").textContent).to.equal(
        "Runtime SSR Page",
      );
      await fs.access(new URL("./public/runtime.route.js", import.meta.url));
    });

    it("should generate the colliding route from the static page", async function () {
      const html = await fs.readFile(
        new URL("./public/about/index.html", import.meta.url),
        "utf-8",
      );
      const dom = new JSDOM(html);
      const headings = dom.window.document.querySelectorAll("body > h1");

      expect(headings.length).to.equal(1);
      expect(headings[0].textContent).to.equal("Static About Page");
    });

    it("should still generate the static paths that do not collide", async function () {
      const html = await fs.readFile(
        new URL("./public/contact/index.html", import.meta.url),
        "utf-8",
      );
      const dom = new JSDOM(html);
      const headings = dom.window.document.querySelectorAll("body > h1");
      const paragraphs = dom.window.document.querySelectorAll("body > p");

      expect(headings.length).to.equal(1);
      expect(headings[0].textContent).to.equal("Dynamic Page");
      expect(paragraphs.length).to.equal(1);
      expect(paragraphs[0].textContent).to.equal("contact");
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
