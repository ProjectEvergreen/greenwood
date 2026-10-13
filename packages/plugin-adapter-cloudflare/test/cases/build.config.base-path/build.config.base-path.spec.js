/*
 * Use Case
 * Run Greenwood with the Cloudflare adapter plugin and a custom base path.
 *
 * User Result
 * Should generate Worker modules and route patterns for SSR and API routes under
 * the configured base path, preserving request queries, bodies, and responses.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterCloudflare } from '@greenwood/plugin-adapter-cloudflare';
 *
 * export default {
 *   basePath: '/my-app',
 *   plugins: [greenwoodPluginAdapterCloudflare()]
 * };
 *
 * User Workspace
 * greenwood.config.js
 * src/
 *   pages/
 *     api/
 *       nested/
 *         endpoint.js
 *       greeting.js
 *       submit-json.js
 *     index.html
 *     users.js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Cloudflare Adapter and Base Path", function () {
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const functionsDir = new URL("./functions/", import.meta.url);
  const publicDir = new URL("./public/", import.meta.url);
  const hostname = "https://example.com";
  let runner;
  let worker;

  before(async function () {
    runner = new Runner();
    await runner.setup(outputPath);
    await runner.runCommand(path.join(process.cwd(), "packages/cli/src/bin.js"), "build");
    worker = (await import(new URL("./worker.js", functionsDir))).default;
  });

  it("should output Worker modules and URL patterns under the base path for SSR and API routes", async function () {
    const source = await fs.readFile(new URL("./worker.js", functionsDir), "utf8");
    expect(source).to.include('pathname: "/my-app/users"');
    expect(source).to.include('pathname: "/my-app/api/greeting"');
    await fs.access(new URL("./my-app/users/users.route.js", functionsDir));
    await fs.access(new URL("./my-app/api/greeting/greeting.js", functionsDir));
  });

  it("should render query parameters for an SSR route under the base path", async function () {
    const response = await worker.fetch(new Request(`${hostname}/my-app/users/?id=42`));
    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/html");
    expect(await response.text()).to.include("<h1>User ID: 42</h1>");
  });

  it("should preserve a JSON POST body and response headers for an API route under the base path", async function () {
    const response = await worker.fetch(
      new Request(`${hostname}/my-app/api/submit-json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Greenwood" }),
      }),
    );

    expect(await response.json()).to.deep.equal({
      message: "Thank you Greenwood for your submission!",
    });
    expect(response.headers.get("content-type")).to.equal("application/json");
    expect(response.headers.get("x-secret")).to.equal("1234");
  });

  it("should return a JSON greeting for an API route under the base path", async function () {
    const response = await worker.fetch(new Request(`${hostname}/my-app/api/greeting`));
    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ message: "Hello" });
  });

  it("should return the expected JSON response for a nested API route under the base path", async function () {
    const response = await worker.fetch(new Request(`${hostname}/my-app/api/nested/endpoint`));
    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ nested: true });
  });

  it("should return 404 for unmatched API requests under the base path", async function () {
    for (const pathname of ["/my-app/api", "/my-app/api/missing"]) {
      const response = await worker.fetch(new Request(`${hostname}${pathname}`));

      expect(response.status).to.equal(404);
    }
  });

  it("should exclude server bundles from static uploads while retaining local output for SSR and API routes", async function () {
    const assetsIgnore = await fs.readFile(new URL("./.assetsignore", publicDir), "utf-8");
    const exclusions = assetsIgnore.split("\n").filter((line) => line.startsWith("/"));

    expect(exclusions.length).to.be.greaterThan(0);
    expect(exclusions.some((file) => file.includes(".route.chunk."))).to.equal(true);
    expect(exclusions.some((file) => file.includes("submit-json"))).to.equal(true);

    for (const file of exclusions) {
      await fs.access(new URL(`.${file}`, publicDir));
    }

    expect(assetsIgnore).to.not.contain("/index.html");
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, "functions"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
