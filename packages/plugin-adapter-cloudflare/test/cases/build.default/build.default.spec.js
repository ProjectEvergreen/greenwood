/*
 * Use Case
 * Run Greenwood with the Cloudflare adapter plugin and SSR pages and API routes.
 *
 * User Result
 * Should generate a Cloudflare Worker entrypoint with SSR and API route modules,
 * copy their supporting chunks, and exclude server bundles from static uploads.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterCloudflare } from '@greenwood/plugin-adapter-cloudflare';
 *
 * export default {
 *   plugins: [greenwoodPluginAdapterCloudflare()]
 * };
 *
 * User Workspace
 * greenwood.config.js
 * src/
 *   components/
 *     card.js
 *   pages/
 *     api/
 *       nested/
 *         endpoint.js
 *       fragment.js
 *       greeting.js
 *       search.js
 *       submit-form-data.js
 *       submit-json.js
 *     blog/
 *       first-post.js
 *       index.js
 *     about.html
 *     artists.js
 *     index.js
 *     post.js
 *     users.js # prerendered SSR (remains dynamic)
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

describe("Build Greenwood With: Cloudflare adapter with default full-stack output", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const serverUrl = new URL("./functions/worker.js", import.meta.url);
  let runner;
  let requestHandler;

  before(async function () {
    this.context = { publicDir: path.join(outputPath, "public") };
    runner = new Runner();
    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build");

    const worker = (await import(serverUrl.href)).default;
    requestHandler = (request) => worker.fetch(request);
  });

  it("should output a Worker entrypoint referencing generated modules for SSR and API routes", async function () {
    const functionsDir = new URL("./functions/", import.meta.url);
    const source = await fs.readFile(serverUrl, "utf8");
    const modules = [
      "index.route.js",
      "users/users.route.js",
      "artists/artists.route.js",
      "post/post.route.js",
      "blog/blog-index.route.js",
      "blog/first-post/blog-first-post.route.js",
      "api/greeting/greeting.js",
      "api/fragment/fragment.js",
      "api/search/search.js",
      "api/submit-json/submit-json.js",
      "api/submit-form-data/submit-form-data.js",
      "api/nested/endpoint/nested-endpoint.js",
    ];

    for (const module of modules) {
      await fs.access(new URL(module, functionsDir));
      expect(source).to.include(`./${module}`);
    }
  });

  it("should render request query parameters for an SSR route at the root", async function () {
    const response = await requestHandler(new Request("http://localhost/?message=Greenwood"));
    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/html");
    expect(await response.text()).to.include("<h1>Home: Greenwood</h1>");
  });

  it("should render a custom element with declarative shadow DOM for an SSR route", async function () {
    const response = await requestHandler(new Request("http://localhost/users/"));
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-cloudflare-card");
    const user = "Analog";

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.include("text/html");
    expect(dom.window.document.querySelector("h1").textContent).to.equal("Users");
    expect(cards.length).to.equal(1);
    expect(cards[0].getAttribute("title")).to.equal(user);
    expect(
      cards[0].querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
        .textContent,
    ).to.equal(user);
  });

  it("should render a collection of custom elements with shadow DOM for an SSR route", async function () {
    const response = await requestHandler(new Request("http://localhost/artists/"));
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-cloudflare-card");

    expect(response.status).to.equal(200);
    expect(dom.window.document.querySelector("h1").textContent).to.equal("List of Artists: 2");
    expect([...cards].map((card) => card.getAttribute("title"))).to.deep.equal(["Analog", "Fave"]);
    expect(
      cards[1].querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
        .textContent,
    ).to.equal("Fave");
  });

  it("should return distinct responses for a blog index SSR route and a nested SSR route", async function () {
    const indexResponse = await requestHandler(new Request("http://localhost/blog/"));
    const postResponse = await requestHandler(new Request("http://localhost/blog/first-post/"));

    expect(indexResponse.status).to.equal(200);
    expect(await indexResponse.text()).to.include("<h1>Blog index</h1>");
    expect(postResponse.status).to.equal(200);
    expect(await postResponse.text()).to.include("<h1>First post</h1>");
  });

  it("should pass request query parameters to an SSR route", async function () {
    const response = await requestHandler(new Request("http://localhost/post/?id=42"));

    expect(response.status).to.equal(200);
    expect(await response.text()).to.include("<h1>Post ID: 42</h1>");
  });

  it("should retain a Worker handler for a prerendered SSR route", async function () {
    const server = await fs.readFile(serverUrl, "utf8");
    expect(server).to.include("users.route.js");
    const worker = (await import(serverUrl.href)).default;
    const response = await worker.fetch(new Request("http://localhost/users/"));
    expect(await response.text()).to.include("<h1>Users</h1>");
  });

  it("should render shared custom elements when revisiting SSR routes", async function () {
    for (const route of ["users", "artists", "users"]) {
      const response = await requestHandler(new Request(`http://localhost/${route}/`));
      expect(response.status).to.equal(200);
      const dom = new JSDOM(await response.text());
      expect(dom.window.document.querySelector("app-cloudflare-card")).not.to.equal(null);
    }
  });

  it("should exclude server modules from static uploads while retaining local bundles for SSR routes", async function () {
    const publicDir = new URL("./public/", import.meta.url);
    const ignore = await fs.readFile(new URL("./.assetsignore", publicDir), "utf8");
    for (const file of await fs.readdir(publicDir)) {
      if (file.includes(".route.") && file.endsWith(".js")) {
        expect(ignore).to.include(`/${file}\n`);
        await fs.access(new URL(file, publicDir));
      }
    }
    expect(ignore).not.to.include("/about/index.html");
  });

  it("should return a JSON greeting using query parameters for a GET API route", async function () {
    const response = await requestHandler(
      new Request("http://localhost/api/greeting?name=Greenwood"),
    );

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.include("application/json");
    expect(await response.json()).to.deep.equal({ message: "Hello Greenwood!" });
  });

  it("should return a rendered HTML fragment with its content type for an API route", async function () {
    const response = await requestHandler(new Request("http://localhost/api/fragment"));
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-cloudflare-card");

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

  it("should preserve a JSON POST body and response headers for an API route", async function () {
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

  it("should pass a URL-encoded form body to an API route", async function () {
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

  it("should render matching custom elements from multipart FormData for a search API route", async function () {
    const body = new FormData();
    body.set("term", "Analog");

    const response = await requestHandler(
      new Request("http://localhost/api/search", { method: "POST", body }),
    );
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-cloudflare-card");

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/html");
    expect(cards.length).to.equal(1);
    expect(cards[0].getAttribute("title")).to.equal("Analog");
    expect(
      cards[0].querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
        .textContent,
    ).to.equal("Analog");
  });

  it("should return a no-results message for a search API route with no matching results", async function () {
    const body = new URLSearchParams({ term: "missing" });
    const response = await requestHandler(
      new Request("http://localhost/api/search", { method: "POST", body }),
    );

    expect(response.status).to.equal(200);
    expect(await response.text()).to.equal("No results found.");
  });

  it("should return the expected response for a nested API route", async function () {
    const response = await requestHandler(new Request("http://localhost/api/nested/endpoint"));

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/plain");
    expect(await response.text()).to.equal("Nested API route");
  });

  it("should return 404 for an unmatched API route", async function () {
    const response = await requestHandler(new Request("http://localhost/api/missing"));

    expect(response.status).to.equal(404);
    expect(await response.text()).to.equal("Not Found");
  });

  it("should return a default greeting for an API route without a query parameter", async function () {
    const response = await requestHandler(new Request("http://localhost/api/greeting"));
    expect(await response.json()).to.deep.equal({ message: "Hello World!" });
  });

  it("should return 404 for an API request to the bare namespace", async function () {
    const response = await requestHandler(new Request("http://localhost/api"));
    expect(response.status).to.equal(404);
  });

  it("should copy URL assets and exclude them from static uploads for API routes", async function () {
    const publicDir = new URL("./public/", import.meta.url);
    const functionsDir = new URL("./functions/", import.meta.url);
    const files = await fs.readdir(new URL("./api/", publicDir));
    const ignore = await fs.readFile(new URL("./.assetsignore", publicDir), "utf8");
    for (const route of ["fragment", "search"]) {
      const chunks = files.filter((file) => file.startsWith(`${route}.`) && file !== `${route}.js`);
      expect(chunks.length).to.be.greaterThan(0);
      for (const chunk of chunks) {
        await fs.access(new URL(`./api/${route}/${chunk}`, functionsDir));
        expect(ignore).to.include(`/api/${chunk}\n`);
      }
    }
  });

  it("should write each .assetsignore exclusion only once for API routes", async function () {
    const ignore = await fs.readFile(new URL("./public/.assetsignore", import.meta.url), "utf8");
    const exclusions = ignore.split("\n").filter((line) => line.startsWith("/api/"));
    expect(exclusions.length).to.be.greaterThan(0);
    expect(new Set(exclusions).size).to.equal(exclusions.length);
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, "functions"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
