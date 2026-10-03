/*
 * Use Case
 * Run Greenwood with the Deno Deploy adapter and the default serveStatic option.
 *
 * User Result
 * Should generate a dynamic server entrypoint for API and SSR routes, with a
 * static file fallback and a custom base path.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterDenoDeploy } from '@greenwood/plugin-adapter-deno-deploy';
 *
 * export default {
 *   basePath: '/my-app',
 *   plugins: [greenwoodPluginAdapterDenoDeploy()]
 * };
 *
 * User Workspace
 * deno.jsonc
 * greenwood.config.ts
 * src/
 *   components/
 *     card.ts
 *   pages/
 *     api/
 *       greeting.ts
 *       nested/
 *         endpoint.ts
 *       product/
 *         [id].ts
 *     artists.ts
 *     blog/
 *       first-post.ts
 *       index.ts
 *     event/
 *       title.ts # prerendered
 *     index.html
 *     post.ts
 *     stories/
 *       [slug].ts
 *     topics/
 *       [topic].ts # getStaticPaths
 *     users.ts
 *   services/
 *     artists.ts
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Deno Deploy adapter and static files", function () {
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

  it("should emit a dynamic server entrypoint with API, SSR, and static file handling", async function () {
    const server = await fs.readFile(serverUrl, "utf8");

    expect(server).to.include('from "../public/users.route.js"');
    expect(server).to.include('from "../public/artists.route.js"');
    expect(server).to.include('from "../public/blog-index.route.js"');
    expect(server).to.include('from "../public/blog-first-post.route.js"');
    expect(server).to.include('from "../public/post.route.js"');
    expect(server).to.include('from "../public/stories--slug-.route.js"');
    expect(server).not.to.include("event-title.route.js");
    expect(server).not.to.include("topics--topic-.route.js");
    expect(server).to.include('from "../public/api/greeting.js"');
    expect(server).to.include('from "../public/api/product--id-.js"');
    expect(server).to.include('from "../public/api/nested-endpoint.js"');
    expect(server).to.include('pathname: "/my-app/users/"');
    expect(server).to.include('pathname: "/my-app/api/greeting"');
    expect(server).to.include('pathname: "/my-app/api/product/:id"');
    expect(server).to.include('pathname: "/my-app/api/nested/endpoint"');
    expect(server).to.include('urlRoot: "my-app"');
    expect(server).to.include("jsr:@std/http@1.1.3/file-server");
    for (const file of [
      "users.route.js",
      "artists.route.js",
      "blog-index.route.js",
      "blog-first-post.route.js",
      "post.route.js",
      "stories--slug-.route.js",
      "api/greeting.js",
      "api/product--id-.js",
      "api/nested-endpoint.js",
    ]) {
      await fs.access(new URL(`./public/${file}`, import.meta.url));
    }
    expect(await fs.readFile(new URL("./public/index.html", import.meta.url), "utf8")).to.include(
      "Home",
    );
  });

  it("returns the expected SSR page response", async function () {
    const response = await requestHandler(new Request("http://localhost/my-app/users/"));
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-card");

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.include("text/html");
    expect(dom.window.document.querySelector("h1").textContent).to.equal("Users");
    expect(cards.length).to.equal(1);
    expect(cards[0].getAttribute("title")).to.equal("Analog");
    expect(
      cards[0].querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
        .textContent,
    ).to.equal("Analog");
  });

  it("renders a collection of custom elements on an SSR page", async function () {
    const response = await requestHandler(new Request("http://localhost/my-app/artists/"));
    const dom = new JSDOM(await response.text());
    const cards = dom.window.document.querySelectorAll("app-card");

    expect(response.status).to.equal(200);
    expect(dom.window.document.querySelector("h1").textContent).to.equal("List of Artists: 2");
    expect([...cards].map((card) => card.getAttribute("title"))).to.deep.equal(["Analog", "Fave"]);
    expect(
      cards[1].querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
        .textContent,
    ).to.equal("Fave");
  });

  it("keeps a blog index route separate from a nested post route", async function () {
    const indexResponse = await requestHandler(new Request("http://localhost/my-app/blog/"));
    const postResponse = await requestHandler(
      new Request("http://localhost/my-app/blog/first-post/"),
    );

    expect(indexResponse.status).to.equal(200);
    expect(await indexResponse.text()).to.include("<h1>Blog index</h1>");
    expect(postResponse.status).to.equal(200);
    expect(await postResponse.text()).to.include("<h1>First post</h1>");
  });

  it("passes the request query to an SSR page", async function () {
    const response = await requestHandler(new Request("http://localhost/my-app/post/?id=42"));

    expect(response.status).to.equal(200);
    expect(await response.text()).to.include("<h1>Post ID: 42</h1>");
  });

  it("passes route parameters to a dynamic SSR page", async function () {
    const response = await requestHandler(new Request("http://localhost/my-app/stories/first/"));

    expect(response.status).to.equal(200);
    expect(await response.text()).to.include("<h1>Story: first</h1>");
  });

  it("routes an API request with a custom base path", async function () {
    const response = await requestHandler(new Request("http://localhost/my-app/api/greeting"));

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ message: "Hello" });
  });

  it("passes parameters to a dynamic API route with a custom base path", async function () {
    const response = await requestHandler(new Request("http://localhost/my-app/api/product/42"));

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ id: "42", method: "GET" });
  });

  it("routes a nested API request with a custom base path", async function () {
    const response = await requestHandler(
      new Request("http://localhost/my-app/api/nested/endpoint"),
    );

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ nested: true });
  });

  it("serves built static HTML for an unmatched page route", async function () {
    const deno = globalThis.Deno;
    const previousDirectory = deno.cwd();

    deno.chdir(outputPath);

    try {
      const response = await requestHandler(new Request("http://localhost/my-app/"));

      expect(response.status).to.equal(200);
      expect(response.headers.get("content-type")).to.include("text/html");
      expect(await response.text()).to.include("<h1>Home</h1>");
    } finally {
      deno.chdir(previousDirectory);
    }
  });

  it("serves prerendered and getStaticPaths pages from static output", async function () {
    const deno = globalThis.Deno;
    const previousDirectory = deno.cwd();

    deno.chdir(outputPath);

    try {
      const event = await requestHandler(new Request("http://localhost/my-app/event/title/"));
      const topic = await requestHandler(new Request("http://localhost/my-app/topics/greenwood/"));

      expect(event.status).to.equal(200);
      expect(await event.text()).to.include("<h1>Prerendered event</h1>");
      expect(topic.status).to.equal(200);
      expect(await topic.text()).to.include("<h1>Static topic</h1>");
    } finally {
      deno.chdir(previousDirectory);
    }
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, ".deno-deploy"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
