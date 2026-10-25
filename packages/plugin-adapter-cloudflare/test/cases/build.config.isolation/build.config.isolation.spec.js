/*
 * Use Case
 * Run Greenwood with the Cloudflare adapter and global isolation mode enabled.
 *
 * User Result
 * Should run each SSR and API request in a fresh Worker, preserving request
 * bodies, route parameters, and response headers without sharing route state.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterCloudflare } from '@greenwood/plugin-adapter-cloudflare';
 *
 * export default {
 *   isolation: true,
 *   plugins: [greenwoodPluginAdapterCloudflare()]
 * };
 *
 * User Workspace
 * greenwood.config.js
 * wrangler.toml
 * src/
 *   components/
 *     card.js
 *   pages/
 *     api/
 *       product/
 *         [id].js
 *       submit-form-data.js
 *     about.html
 *     first.js
 *     second.js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { JSDOM } from "jsdom";
import { FormData as WorkerFormData, Miniflare } from "miniflare";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Cloudflare adapter and global route isolation", function () {
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const functionsDir = new URL("./functions/", import.meta.url);
  let runner;
  let runtime;

  before(async function () {
    runner = new Runner();
    await runner.setup(outputPath);
    await runner.runCommand(path.join(process.cwd(), "packages/cli/src/bin.js"), "build");

    const modules = {};
    for (const file of await fs.readdir(functionsDir, { recursive: true })) {
      if (file.endsWith(".js")) {
        modules[file.split(path.sep).join("/")] = {
          type: "esm",
          contents: await fs.readFile(
            new URL(file.split(path.sep).join("/"), functionsDir),
            "utf8",
          ),
        };
      }
    }
    runtime = new Miniflare({
      workers: [
        {
          config: {
            name: "greenwood",
            compatibilityDate: "2026-10-03",
            compatibilityFlags: ["new_module_registry"],
            manifest: { mainModule: "worker.js", modules },
            env: {
              GREENWOOD_ISOLATION: { type: "worker-loader" },
              ASSETS: {
                type: "fetcher",
                handler: async () =>
                  new Response("Static asset", { headers: { "x-static": "true" } }),
              },
            },
          },
        },
      ],
    });
    await runtime.ready;
  });

  it("should package module source without evaluating isolated SSR and API routes in the parent Worker", async function () {
    const source = await fs.readFile(new URL("worker.js", functionsDir), "utf8");
    expect(source).to.include("GreenwoodAssets");

    for (const [directory, id] of [
      ["first", "first"],
      ["second", "second"],
      ["api/product/[id]", "product--id-"],
    ]) {
      const module = `${directory}/${id}.worker-code.js`;
      const { default: code } = await import(new URL(module, functionsDir));

      expect(source).to.include(`./${module}`);
      expect(code.compatibilityDate).to.equal("2026-10-03");
      expect(code.compatibilityFlags).to.deep.equal(["new_module_registry"]);
      expect(code.modules).to.have.property(code.mainModule);
      expect(Object.keys(code.modules).length).to.be.greaterThan(1);
      expect(await fs.readdir(new URL(`${directory}/`, functionsDir))).to.deep.equal([
        `${id}.worker-code.js`,
      ]);
    }
    expect(globalThis.customElements?.get("app-cloudflare-isolated")).to.equal(undefined);
  });

  it("should use a fresh custom element registry for each isolated SSR route request", async function () {
    for (const [route, heading] of [
      ["first", "First page"],
      ["second", "Second page"],
      ["first", "First page"],
    ]) {
      const response = await runtime.dispatchFetch(`http://localhost/${route}/`);
      const dom = new JSDOM(await response.text());
      const card = dom.window.document.querySelector("app-cloudflare-isolated");

      expect(response.status).to.equal(200);
      expect(response.headers.get("content-type")).to.include("text/html");
      expect(dom.window.document.querySelector("h1").textContent).to.equal(heading);
      expect(
        card.querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
          .textContent,
      ).to.equal("Shared card");
    }
    expect(globalThis.customElements?.get("app-cloudflare-isolated")).to.equal(undefined);
  });

  it("should preserve a JSON POST body, path parameters, status, and headers for an isolated API route", async function () {
    const response = await runtime.dispatchFetch("http://localhost/api/product/42", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Greenwood" }),
    });

    expect(response.status).to.equal(201);
    expect(response.headers.get("x-isolated")).to.equal("true");
    expect(await response.json()).to.deep.equal({
      id: "42",
      method: "POST",
      body: { name: "Greenwood" },
      requests: 1,
    });
  });

  it("should reset module state for each isolated API route request", async function () {
    for (let index = 0; index < 2; index++) {
      const response = await runtime.dispatchFetch("http://localhost/api/product/99");
      expect(response.status).to.equal(201);
      expect(await response.json()).to.deep.equal({
        id: "99",
        method: "GET",
        body: null,
        requests: 1,
      });
    }
  });

  it("should preserve multipart form data and a streaming response for an isolated API route", async function () {
    const body = new WorkerFormData();
    body.set("name", "Greenwood");
    const response = await runtime.dispatchFetch("http://localhost/api/submit-form-data", {
      method: "POST",
      body,
    });

    expect(response.status).to.equal(200);
    expect(response.headers.get("content-type")).to.equal("text/plain");
    expect(await response.text()).to.equal("Hello Greenwood!");
  });

  it("should exclude packaged server modules from static uploads for isolated SSR and API routes", async function () {
    const publicDir = new URL("./public/", import.meta.url);
    const ignore = await fs.readFile(new URL(".assetsignore", publicDir), "utf8");
    const { default: code } = await import(new URL("first/first.worker-code.js", functionsDir));
    const chunks = Object.keys(code.modules).filter((name) => name.includes(".route.chunk"));
    expect(chunks.length).to.be.greaterThan(0);

    for (const file of ["first.route.js", "second.route.js", "api/product--id-.js", ...chunks]) {
      expect(ignore).to.include(`/${file}\n`);
      await fs.access(new URL(file, publicDir));
    }
    expect(ignore).not.to.include("/about/index.html");
    await fs.access(new URL("about/index.html", publicDir));
  });

  it("should return 404 for an unmatched API route with isolation enabled", async function () {
    const response = await runtime.dispatchFetch("http://localhost/api/missing");
    expect(response.status).to.equal(404);
    expect(await response.text()).to.equal("Not Found");
  });

  it("should forward a static request to the asset binding with isolation enabled", async function () {
    const response = await runtime.dispatchFetch("http://localhost/about/");
    expect(response.status).to.equal(200);
    expect(response.headers.get("x-static")).to.equal("true");
    expect(await response.text()).to.equal("Static asset");
  });

  after(async function () {
    await runtime?.dispose();
    await runner.teardown([
      path.join(outputPath, "functions"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
