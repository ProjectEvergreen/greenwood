/*
 * Use Case
 * Run Greenwood with the Deno Deploy adapter and global route isolation enabled.
 *
 * User Result
 * Should load each SSR route in a fresh worker only when requested, allowing
 * separate routes to register the same custom element without a conflict.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginAdapterDenoDeploy } from '@greenwood/plugin-adapter-deno-deploy';
 *
 * export default {
 *   isolation: true,
 *   plugins: [greenwoodPluginAdapterDenoDeploy({ serveStatic: false })]
 * };
 *
 * User Workspace
 * deno.jsonc
 * greenwood.config.ts
 * src/
 *   components/
 *     card.ts
 *   pages/
 *     first.ts
 *     second.ts
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { JSDOM } from "jsdom";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Deno Deploy adapter and route isolation", function () {
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

    // Importing the generated entrypoint starts Deno.serve; capture its handler without opening a listener.
    deno.serve = (handler) => {
      requestHandler = handler;
    };

    try {
      await import(serverUrl.href);
    } finally {
      deno.serve = originalServe;
    }
  });

  it("should generate isolated routes without importing them at startup", async function () {
    const server = await fs.readFile(serverUrl, "utf8");
    const worker = await fs.readFile(
      new URL("./.deno-deploy/route-worker.js", import.meta.url),
      "utf8",
    );

    expect(server).to.include(
      'moduleUrl: new URL("../public/first.route.js", import.meta.url).href, isolation: true',
    );
    expect(server).to.include(
      'moduleUrl: new URL("../public/second.route.js", import.meta.url).href, isolation: true',
    );
    expect(server).not.to.include("import { handler as");
    expect(worker).to.include("await import(moduleUrl)");
    expect(globalThis.customElements?.get("app-shared")).to.equal(undefined);

    for (const file of ["first.route.js", "second.route.js"]) {
      await fs.access(new URL(`./public/${file}`, import.meta.url));
    }
  });

  it("should render one shared custom element across isolated SSR routes", async function () {
    // Revisit the first route to verify each request gets a fresh worker and registry.
    for (const [route, heading] of [
      ["first", "First page"],
      ["second", "Second page"],
      ["first", "First page"],
    ]) {
      const response = await requestHandler(new Request(`http://localhost/${route}/`));
      const dom = new JSDOM(await response.text());
      const card = dom.window.document.querySelector("app-shared");

      expect(response.status).to.equal(200);
      expect(dom.window.document.querySelector("h1").textContent).to.equal(heading);
      expect(
        card.querySelector('template[shadowrootmode="open"]').content.querySelector("h2")
          .textContent,
      ).to.equal("Shared card");
    }

    expect(globalThis.customElements?.get("app-shared")).to.equal(undefined);
  });

  after(async function () {
    await runner.teardown([
      path.join(outputPath, ".deno-deploy"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
