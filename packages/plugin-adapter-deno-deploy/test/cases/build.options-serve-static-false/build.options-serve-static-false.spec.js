import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Deno Deploy adapter and serveStatic disabled", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const serverUrl = new URL("./.deno-deploy/server.js", import.meta.url);
  let runner;

  before(async function () {
    this.context = { publicDir: path.join(outputPath, "public") };
    runner = new Runner();
    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build");
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

  after(async function () {
    await runner.teardown([
      path.join(outputPath, ".deno-deploy"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
