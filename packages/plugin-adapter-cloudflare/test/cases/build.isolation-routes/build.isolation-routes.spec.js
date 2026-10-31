/*
 * Use Case
 * Run Greenwood with the Cloudflare adapter, route-level isolation, and a base path.
 *
 * User Result
 * Should isolate only opted-in SSR and API routes, retain shared route behavior,
 * and apply the adapter's compatibility options to isolated Workers.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterCloudflare } from '@greenwood/plugin-adapter-cloudflare';
 *
 * export default {
 *   basePath: '/my-app',
 *   plugins: [greenwoodPluginAdapterCloudflare({
 *     wrangler: {
 *       compatibilityDate: '2026-10-01',
 *       compatibilityFlags: ['new_module_registry', 'nodejs_compat']
 *     }
 *   })]
 * };
 *
 * User Workspace
 * greenwood.config.js
 * wrangler.toml
 * src/
 *   pages/
 *     api/
 *       product/
 *         [id].js # isolation = true
 *       greeting.js
 *     blog/
 *       [slug].js # isolation = true
 *     users.js
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { Miniflare } from "miniflare";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Cloudflare adapter and route-level isolation", function () {
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
            compatibilityDate: "2026-10-01",
            compatibilityFlags: ["new_module_registry", "nodejs_compat"],
            manifest: { mainModule: "worker.js", modules },
            env: {
              GREENWOOD_ISOLATION: { type: "worker-loader" },
            },
          },
        },
      ],
    });
    await runtime.ready;
  });

  it("should apply custom compatibility settings to isolated SSR and API route packages", async function () {
    for (const module of [
      "my-app/blog/[slug]/blog--slug-.worker-code.js",
      "my-app/api/product/[id]/product--id-.worker-code.js",
    ]) {
      const { default: code } = await import(new URL(module, functionsDir));
      expect(code.compatibilityDate).to.equal("2026-10-01");
      expect(code.compatibilityFlags).to.deep.equal(["new_module_registry", "nodejs_compat"]);
    }
    await fs.access(new URL("my-app/users/users.route.js", functionsDir));
    await fs.access(new URL("my-app/api/greeting/greeting.js", functionsDir));
  });

  it("should pass path parameters to an isolated dynamic SSR route with a base path", async function () {
    const response = await runtime.dispatchFetch("http://localhost/my-app/blog/greenwood/");
    expect(response.status).to.equal(200);
    expect(await response.text()).to.include("<h1>Blog: greenwood</h1>");
  });

  it("should reset state and pass path parameters for an isolated dynamic API route with a base path", async function () {
    for (let index = 0; index < 2; index++) {
      const response = await runtime.dispatchFetch("http://localhost/my-app/api/product/42");
      expect(response.status).to.equal(200);
      expect(await response.json()).to.deep.equal({ id: "42", requests: 1 });
    }
  });

  it("should render a shared SSR route alongside isolated routes", async function () {
    const response = await runtime.dispatchFetch("http://localhost/my-app/users/");
    expect(response.status).to.equal(200);
    expect(await response.text()).to.include("<h1>Users</h1>");
  });

  it("should preserve module state across requests for a shared API route", async function () {
    for (const requests of [1, 2]) {
      const response = await runtime.dispatchFetch("http://localhost/my-app/api/greeting");
      expect(response.status).to.equal(200);
      expect(await response.json()).to.deep.equal({ message: "Hello World!", requests });
    }
  });

  after(async function () {
    await runtime?.dispose();
    await runner.teardown([
      path.join(outputPath, "functions"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
