import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Deno Deploy adapter and static files", function () {
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

  it("should emit a dynamic server entrypoint with API, SSR, and static file handling", async function () {
    const server = await fs.readFile(serverUrl, "utf8");

    expect(server).to.include('from "../public/users.route.js"');
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

  after(async function () {
    await runner.teardown([
      path.join(outputPath, ".deno-deploy"),
      ...getOutputTeardownFiles(outputPath),
    ]);
  });
});
