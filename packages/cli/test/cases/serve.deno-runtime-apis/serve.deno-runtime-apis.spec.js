/*
 * Use Case
 * Run Greenwood with SSR and API routes that use APIs from the Deno namespace.
 *
 * User Result
 * Should bundle and serve both routes when Greenwood itself is running with Deno.
 *
 * User Command
 * greenwood build
 * greenwood serve
 *
 * User Config
 * N / A
 *
 * User Workspace
 * src/
 *   layouts/
 *     app.html
 *   pages/
 *     api/
 *       runtime.ts
 *     runtime.ts
 *   services/
 *     runtime.ts
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Serve Greenwood With: ", function () {
  const LABEL = "Deno Runtime APIs";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
  let runner;

  const expectedRuntimeInfo = {
    runtime: "deno",
    deno: globalThis.Deno.version.deno,
    v8: globalThis.Deno.version.v8,
    typescript: globalThis.Deno.version.typescript,
    os: globalThis.Deno.build.os,
    arch: globalThis.Deno.build.arch,
  };

  before(function () {
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      hostname = await startServer(runner, cliPath, "serve");
    });

    describe("SSR route using the Deno namespace", function () {
      let response;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}/runtime/`);
        dom = new JSDOM(await response.text());
      });

      it("should return the runtime information rendered into the page", function () {
        const runtimeInfo = dom.window.document.querySelector("[data-runtime-info]");

        expect(response.status).to.equal(200);
        expect(response.headers.get("content-type")).to.equal("text/html");
        expect(JSON.parse(runtimeInfo.textContent)).to.deep.equal(expectedRuntimeInfo);
      });
    });

    describe("API route using the Deno namespace", function () {
      let response;
      let data;

      before(async function () {
        response = await fetch(`${hostname}/api/runtime`);
        data = await response.json();
      });

      it("should return the runtime information as JSON", function () {
        expect(response.status).to.equal(200);
        expect(response.headers.get("content-type")).to.equal("application/json");
        expect(data).to.deep.equal(expectedRuntimeInfo);
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
