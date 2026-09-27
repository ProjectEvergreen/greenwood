/*
 * Use Case
 * Run Greenwood with the Deno Deploy adapter and serveStatic disabled.
 *
 * User Result
 * Should generate an API server entrypoint that returns 404 for unmatched
 * non-API requests without importing a static file server.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterDenoDeploy } from '@greenwood/plugin-adapter-deno-deploy';
 *
 * export default {
 *   plugins: [greenwoodPluginAdapterDenoDeploy({ serveStatic: false })]
 * };
 *
 * User Workspace
 * deno.jsonc
 * greenwood.config.js
 * src/
 *   components/
 *     card.js
 *   pages/
 *     api/
 *       fragment.js
 *       greeting.js
 *       nested/
 *         endpoint.js
 *       product/
 *         [id].js
 *       search.js
 *       submit-form-data.js
 *       submit-json.js
 *   services/
 *     artists.js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Deno Deploy adapter and serveStatic disabled", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const serverUrl = new URL("./.deno-deploy/server.js", import.meta.url);
  let runner;
  let requestHandler;

  before(async function () {
    this.context = { publicDir: path.join(outputPath, "public") };
    runner = new Runner();
    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build");

    const deno = globalThis.Deno;
    const originalServe = deno.serve;

    // The generated entrypoint calls Deno.serve on import; capture its handler to test responses without opening a listener.
    deno.serve = (handler) => {
      requestHandler = handler;
    };

    try {
      await import(serverUrl.href);
    } finally {
      // restore `Deno.serve` to its original implementation so that other tests can run without error
      deno.serve = originalServe;
    }
  });

  it("writes an API entrypoint without a static file server", async function () {
    const server = await fs.readFile(serverUrl, "utf8");

    expect(server).to.include('from "../public/api/greeting.js"');
    expect(server).to.include('pathname: "/api/greeting"');
    expect(server).not.to.include("@std/http");
    expect(server).not.to.include("serveDir");
    expect(server).to.include('return new Response("Not found", { status: 404 });');
    await fs.access(new URL("./public/api/greeting.js", import.meta.url));
  });

  it("returns a JSON greeting from a GET route", async function () {
    const response = await requestHandler(
      new Request("http://localhost/api/greeting?name=Greenwood"),
    );

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.include("application/json");
    expect(await response.json()).to.deep.equal({ message: "Hello Greenwood!" });
  });

  it("returns an HTML fragment with its content type", async function () {
    const response = await requestHandler(new Request("http://localhost/api/fragment"));
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-card");

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/html");
    expect(cards.length).to.equal(2);
    expect(cards[0].getAttribute("title")).to.equal("Analog");
    expect(cards[1].getAttribute("title")).to.equal("Fave");
    expect(
      cards[0].querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
        .textContent,
    ).to.equal("Analog");
  });

  it("passes a JSON POST body and preserves response headers", async function () {
    const response = await requestHandler(
      new Request("http://localhost/api/submit-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Greenwood" }),
      }),
    );

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.include("application/json");
    expect(response.headers.get("x-secret")).to.equal("1234");
    expect(await response.json()).to.deep.equal({
      message: "Thank you Greenwood for your submission!",
    });
  });

  it("passes a URL-encoded form body", async function () {
    const response = await requestHandler(
      new Request("http://localhost/api/submit-form-data", {
        method: "POST",
        body: new URLSearchParams({ name: "Greenwood" }),
      }),
    );

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/html");
    expect(await response.text()).to.equal("Thank you Greenwood for your submission!");
  });

  it("passes multipart FormData to a search route", async function () {
    const body = new FormData();
    body.set("term", "Analog");

    const response = await requestHandler(
      new Request("http://localhost/api/search", { method: "POST", body }),
    );
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-card");

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/html");
    expect(cards.length).to.equal(1);
    expect(cards[0].getAttribute("title")).to.equal("Analog");
    expect(
      cards[0].querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
        .textContent,
    ).to.equal("Analog");
  });

  it("returns a message when a search has no matches", async function () {
    const body = new URLSearchParams({ term: "missing" });
    const response = await requestHandler(
      new Request("http://localhost/api/search", { method: "POST", body }),
    );

    expect(response.status).to.equal(200);
    expect(await response.text()).to.equal("No results found.");
  });

  it("routes a nested API endpoint", async function () {
    const response = await requestHandler(new Request("http://localhost/api/nested/endpoint"));

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/plain");
    expect(await response.text()).to.equal("Nested API route");
  });

  it("passes route parameters to a dynamic API endpoint", async function () {
    const response = await requestHandler(new Request("http://localhost/api/product/42"));

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ id: "42", method: "GET" });
  });

  it("returns JSON 404 for an unmatched API route", async function () {
    const response = await requestHandler(new Request("http://localhost/api/missing"));

    expect(response.status).to.equal(404);
    expect(await response.json()).to.deep.equal({ error: "API route not found" });
  });

  it("returns 404 for an unmatched non-API route", async function () {
    const response = await requestHandler(new Request("http://localhost/missing"));

    expect(response.status).to.equal(404);
    expect(await response.text()).to.equal("Not found");
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, ".deno-deploy"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
