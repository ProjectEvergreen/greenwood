/*
 * Use Case
 * Run Greenwood with a custom adapter plugin with SSR pages and API routes.
 *
 * User Result
 * Should generate a Greenwood build with expected transformations applied from the plugin.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * async function genericAdapter(compilation, options) { ... }
 *
 * {
 *   plugins: [{
 *     type: 'adapter',
 *     name: 'plugin-generic-adapter',
 *     provider: (compilation, options) => genericAdapter
 *   }]
 * }
 *
 * Custom Workspace
 * src/
 *   components/
 *     card.js
 *   pages/
 *     api/
 *       nested/
 *         endpoint.js
 *       greeting.js
 *       webhook.js
 *     blog/
 *       first-post.js
 *       index.js
 *     about.js
 *     index.js
 */
import chai from "chai";
import glob from "glob-promise";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath, pathToFileURL } from "node:url";
import { JSDOM } from "jsdom";

const expect = chai.expect;

describe("Build Greenwood With: ", function () {
  const LABEL = "Generic Adapter Plugin with SSR Pages + API Routes";
  const cliPath = path.join(process.cwd(), "packages/cli/src/index.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(cliPath, "build");
    });

    describe("Adapting an SSR Page", function () {
      let dom;
      let response;

      before(async function () {
        const req = new Request(new URL("http://localhost:8080/index"));
        const { handler } = await import(
          new URL("./adapter-output/index.js", pathToFileURL(outputPath))
        );

        response = await handler(req);
        dom = new JSDOM(await response.text());
      });

      it("should have the expected content-type for the response", function () {
        expect(response.headers.get("content-type")).to.be.equal("text/html");
      });

      it("should have the expected number of <app-card> components on the page", function () {
        const cards = dom.window.document.querySelectorAll("body > app-card");

        expect(cards).to.have.lengthOf(1);
      });

      it("should have the expected static heading content rendered inside the <app-card> component on the page", function () {
        const heading = dom.window.document.querySelectorAll("app-card h2");

        expect(heading).to.have.lengthOf(1);
        expect(heading[0].textContent).to.be.equal("Analog");
      });

      it("should have the expected static img content rendered inside the <app-card> component on the page", function () {
        const img = dom.window.document.querySelectorAll("app-card img");

        expect(img).to.have.lengthOf(1);
        expect(img[0].getAttribute("src")).to.be.equal(
          "https://www.analogstudios.net/images/analog.png",
        );
      });
    });

    describe("Adapting an API Route", function () {
      let data;
      let response;

      before(async function () {
        const handler = (
          await import(new URL("./adapter-output/api-greeting.js", pathToFileURL(outputPath)))
        ).handler;
        const req = new Request(new URL("http://localhost:8080/api/greeting?name=Greenwood"));

        response = await handler(req);
        data = await response.json();
      });

      it("should have the expected content-type for the response", function () {
        expect(response.headers.get("content-type")).to.be.equal("application/json");
      });

      it("should have the expected message from the API when a query is passed", function () {
        expect(data.message).to.be.equal("Hello Greenwood!");
      });
    });

    describe("Adapting a nested API Route", function () {
      let response;
      let body;

      before(async function () {
        const handler = (
          await import(
            new URL("./adapter-output/api-nested-endpoint.js", pathToFileURL(outputPath))
          )
        ).handler;
        const req = new Request(new URL("http://localhost:8080/api/nested/endpoint"));

        response = await handler(req);
        body = await response.text();
      });

      it("should have the expected content-type for the response", function () {
        expect(response.headers.get("content-type")).to.be.equal("text/html");
      });

      it("should have the expected message from the API when a query is passed", function () {
        expect(body).to.be.equal("I am a nested API route!");
      });
    });

    describe("Adapting a nested SSR Page (duplicate name)", function () {
      let dom;
      let response;

      before(async function () {
        const req = new Request(new URL("http://localhost:8080/blog/"));
        const handler = (
          await import(new URL("./adapter-output/blog-index.js", pathToFileURL(outputPath)))
        ).handler;

        response = await handler(req);
        dom = new JSDOM(await response.text());
      });

      it("should have the expected content-type for the response", function () {
        expect(response.headers.get("content-type")).to.be.equal("text/html");
      });

      it("should have the expected number of <app-card> components on the page", function () {
        const heading = dom.window.document.querySelectorAll("body > h1");

        expect(heading).to.have.lengthOf(1);
        expect(heading[0].textContent).to.equal("Duplicated and nested SSR page should work!");
      });
    });

    describe("Adapting a nested SSR Page", function () {
      let dom;
      let response;

      before(async function () {
        const req = new Request(new URL("http://localhost:8080/blog/first-post/"));
        const handler = (
          await import(new URL("./adapter-output/blog-first-post.js", pathToFileURL(outputPath)))
        ).handler;

        response = await handler(req);
        dom = new JSDOM(await response.text());
      });

      it("should have the expected content-type for the response", function () {
        expect(response.headers.get("content-type")).to.be.equal("text/html");
      });

      it("should have the expected number of <app-card> components on the page", function () {
        const heading = dom.window.document.querySelectorAll("body > h1");

        expect(heading).to.have.lengthOf(1);
        expect(heading[0].textContent).to.equal("Nested SSR First Post page should work!");
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1465
    describe("Adapting of an API route with lots of dynamic chunk bundles", function () {
      let chunks;

      before(async function () {
        chunks = await glob.promise(path.join(outputPath, "adapter-output/webhook.*.js"));
      });

      it("should contain one javascript file in the output directory", async function () {
        expect(chunks.length).to.equal(15);
      });
    });

    // https://github.com/ProjectEvergreen/greenwood/issues/1465
    describe("Adapting of a SSR page function with lots of dynamic chunk bundles", function () {
      let chunks;

      before(async function () {
        chunks = await glob.promise(path.join(outputPath, "adapter-output/about.route.chunk.*.js"));
      });

      it("should contain one javascript file in the output directory", async function () {
        expect(chunks.length).to.equal(16);
      });
    });
  });

  after(function () {
    runner.teardown([
      path.join(outputPath, "adapter-output"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
