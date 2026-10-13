/*
 * Use Case
 * Run Greenwood with the Cloudflare adapter plugin and dynamic file-based routing.
 *
 * User Result
 * Should generate Worker modules for dynamic SSR and API routes, pass path
 * parameters to handlers, and prioritize literal routes over dynamic segments.
 * Pages using getStaticPaths or staticExport should remain static output.
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
 *   pages/
 *     api/
 *       product/
 *         [id].js
 *         featured.js
 *     artists/
 *       [name].js # uses getStaticPaths
 *     blog/
 *       [slug].js
 *       featured.js
 *     event/
 *       title.js # has staticExport = true
 *     index.html
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Cloudflare adapter and dynamic routing", function () {
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const functionsDir = new URL("./functions/", import.meta.url);
  const publicDir = new URL("./public/", import.meta.url);
  const hostname = "https://example.com";
  let runner;
  let worker;
  let source;

  before(async function () {
    runner = new Runner(true);
    await runner.setup(outputPath);
    await runner.runCommand(path.join(process.cwd(), "packages/cli/src/bin.js"), "build");
    source = await fs.readFile(new URL("./worker.js", functionsDir), "utf8");
    worker = (await import(new URL("./worker.js", functionsDir))).default;
  });

  it("should output generated modules and URL patterns for dynamic SSR and API routes", async function () {
    for (const module of [
      "blog/[slug]/blog--slug-.route.js",
      "blog/featured/blog-featured.route.js",
      "api/product/[id]/product--id-.js",
      "api/product/featured/product-featured.js",
    ]) {
      await fs.access(new URL(module, functionsDir));
      expect(source).to.include(`./${module}`);
    }
    expect(source).to.include('pathname: "/blog/:slug"');
    expect(source).to.include('pathname: "/api/product/:id"');
  });

  it("should pass path parameters to a dynamic SSR route", async function () {
    const response = await worker.fetch(new Request(`${hostname}/blog/my-first-post/`));
    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/html");
    expect(await response.text()).to.include("<h1>my-first-post</h1>");
  });

  it("should copy required chunks and exclude them from static uploads for a dynamic SSR route", async function () {
    const files = await fs.readdir(new URL("./blog/[slug]/", functionsDir));
    const chunks = files.filter((file) => file.includes(".route.chunk."));
    expect(chunks.length).to.be.greaterThan(0);
    const ignore = await fs.readFile(new URL("./.assetsignore", publicDir), "utf8");
    for (const chunk of chunks) {
      expect(ignore).to.include(`/${chunk}\n`);
      await fs.access(new URL(chunk, publicDir));
    }
  });

  it("should match a literal SSR route before a dynamic SSR route", async function () {
    const response = await worker.fetch(new Request(`${hostname}/blog/featured/`));
    expect(response.status).to.equal(200);
    expect(await response.text()).to.include("<h1>Featured post</h1>");
  });

  it("should pass path parameters to a dynamic API route", async function () {
    const response = await worker.fetch(new Request(`${hostname}/api/product/42`));
    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ id: "42", method: "GET" });
  });

  it("should preserve the request method for a dynamic API route", async function () {
    const response = await worker.fetch(
      new Request(`${hostname}/api/product/42`, { method: "DELETE" }),
    );
    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ id: "42", method: "DELETE" });
  });

  it("should match a literal API route before a dynamic API route", async function () {
    const response = await worker.fetch(new Request(`${hostname}/api/product/featured`));
    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ featured: true });
  });

  it("should omit a Worker handler and preserve static HTML for an SSR route using getStaticPaths", async function () {
    expect(source).not.to.include("artists");
    for (const name of ["foo", "bar", "baz"]) {
      const html = await fs.readFile(new URL(`./artists/${name}/index.html`, publicDir), "utf8");
      expect(html).to.include("Some Artists Page");
    }
    const files = await fs.readdir(publicDir);
    expect(files.some((file) => file.startsWith("artists--name-.route"))).to.equal(false);
  });

  it("should omit a Worker handler and preserve static HTML for an SSR route using staticExport", async function () {
    expect(source).not.to.include("event/title");
    const html = await fs.readFile(new URL("./event/title/index.html", publicDir), "utf8");
    expect(html).to.include("Events");
    const files = await fs.readdir(publicDir);
    expect(files.some((file) => file.startsWith("event-title.route"))).to.equal(false);
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, "functions"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
