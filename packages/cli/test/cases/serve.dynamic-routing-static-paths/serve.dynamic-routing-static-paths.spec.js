/*
 * Use Case
 * Run Greenwood with SSR routes and API route that use getStaticPaths / getStaticParams file-based routing.
 *
 * User Result
 * Should run a Greenwood build and can handle serving static generation for dynamic routes.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {}
 *
 * User Workspace
 *  src/
 *   components/
 *     greeting.js
 *     header.js
 *   layouts/
 *     app.html
 *   pages/
 *     blog/
 *       [slug].ts
 *     events/
 *       [title].js
 *     product/
 *       [name].js
 *     index.html
 *   services/
 *     blog-posts.ts
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Dynamic Routing for Get Static Paths and Get Static Params";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8080";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
      hostname,
    };
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
              if (message.includes(`Started server at ${hostname}`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Build Output", function () {
      it("should have only two SSR page chunks (for events page)", async function () {
        const files = await Array.fromAsync(
          fs.glob("*.js", { cwd: new URL("./public", import.meta.url) }),
        );

        expect(files.length).to.equal(4);
      });
    });

    describe("A static HTML page with correctly synced page resources", function () {
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected output for the page in the h1 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("This is my site");
      });

      it("should have the expected output for the page in the h2 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h2");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("Home Page");
      });

      it("should have the expected bundled script tag for the header component", function () {
        const scripts = dom.window.document.querySelectorAll("head > script");
        const headingScript = Array.from(scripts).filter(
          (script) => script.getAttribute("src")?.indexOf("header") > 0,
        );

        expect(headingScript.length).to.equal(1);
        expect(headingScript[0].getAttribute("src").startsWith("/header.")).to.equal(true);
      });

      it("should have the expected bundled script tag for the greeting component", function () {
        const scripts = dom.window.document.querySelectorAll("head > script");
        const greetingScript = Array.from(scripts).filter(
          (script) => script.getAttribute("src")?.indexOf("greeting") > 0,
        );

        expect(greetingScript.length).to.equal(1);
        expect(greetingScript[0].getAttribute("src").startsWith("/greeting.")).to.equal(true);
      });
    });

    describe("An SSR page with a dynamic route segment with default export", function () {
      const slug = "first-post";
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/blog/${slug}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected bundled script tag for the header component", function () {
        const scripts = dom.window.document.querySelectorAll("head > script");
        const headingScript = Array.from(scripts).filter(
          (script) => script.getAttribute("src")?.indexOf("header") > 0,
        );

        expect(headingScript.length).to.equal(1);
        expect(headingScript[0].getAttribute("src").startsWith("/header.")).to.equal(true);
      });

      it("should have the expected output for the page in the h1 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("This is my site");
      });

      it("should have the expected output for the page in the h2 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h2");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("First Post");
      });

      it("should have the expected output for the page in the content", function () {
        const paragraphs = dom.window.document.querySelectorAll("body > p");

        expect(paragraphs.length).to.equal(1);
        expect(paragraphs[0].textContent).to.equal("This is the first post.");
      });
    });

    describe("An SSR page with a dynamic route segment with getBody", function () {
      const name = "My Cool Product";
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/product/${name.replace(/ /g, "-").toLowerCase()}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected bundled script tag for the header component", function () {
        const scripts = dom.window.document.querySelectorAll("head > script");
        const headingScript = Array.from(scripts).filter(
          (script) => script.getAttribute("src")?.indexOf("header") > 0,
        );

        expect(headingScript.length).to.equal(1);
        expect(headingScript[0].getAttribute("src").startsWith("/header.")).to.equal(true);
      });

      it("should have the expected output for the page in the h1 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("This is my site");
      });

      it("should have the expected output for the page in the h2 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h2");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal(name);
      });
    });

    describe("An SSR page with a dynamic route segment that NOT be static", function () {
      const title = "My Cool Product";
      let response;
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/events/${title.replace(/ /g, "-").toLowerCase()}/`);
        body = await response.clone().text();
        dom = new JSDOM(body);
      });

      it("should have the expected bundled script tag for the header component", function () {
        const scripts = dom.window.document.querySelectorAll("head > script");
        const headingScript = Array.from(scripts).filter(
          (script) => script.getAttribute("src")?.indexOf("header") > 0,
        );

        expect(headingScript.length).to.equal(1);
        expect(headingScript[0].getAttribute("src").startsWith("/header.")).to.equal(true);
      });

      it("should have the expected output for the page in the h1 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h1");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal("This is my site");
      });

      it("should have the expected output for the page in the h2 tag", function () {
        const headings = dom.window.document.querySelectorAll("body > h2");

        expect(headings.length).to.equal(1);
        expect(headings[0].textContent).to.equal(title.toUpperCase());
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
