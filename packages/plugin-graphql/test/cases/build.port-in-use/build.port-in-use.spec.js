/*
 * Build a static SSR page that queries GraphQL from a render worker while port 4000 is occupied.
 * The worker and the server-side cache client must both use GraphQL's selected port.
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: GraphQL Port Already In Use", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const runner = new Runner();
  const preferredPort = 4000;
  let output = "";
  let blocker;

  before(async function () {
    blocker = net.createServer();
    await new Promise((resolve, reject) => {
      blocker.once("error", reject);
      blocker.listen(preferredPort, resolve);
    });

    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build", {
      onStdOut: (message) => {
        output += message;
      },
    });
  });

  it("should select a port above the occupied GraphQL port", function () {
    // Apollo derives the hostname from the bind address, which can be 0.0.0.0 on Deno/Windows.
    // Parse the reported URL instead of assuming localhost.
    const server = output.match(/GraphQLServer started at (http:\/\/\S+)\r?\n/);

    expect(server).not.to.be.null;
    expect(Number(new URL(server[1]).port)).to.be.greaterThan(preferredPort);
  });

  it("should query the fallback GraphQL port from a render worker", async function () {
    const html = await fs.readFile(path.join(outputPath, "public/index.html"), "utf-8");

    expect(html).to.contain("<h1>GraphQL pages: 1</h1>");
    expect(html).not.to.contain("data-graphql-port");
  });

  it("should generate cached query data using the selected GraphQL port", async function () {
    const files = await fs.readdir(path.join(outputPath, "public"));
    const caches = files.filter((file) => file.endsWith("-cache.json"));

    expect(caches).to.have.lengthOf(1);
    const data = JSON.parse(await fs.readFile(path.join(outputPath, "public", caches[0]), "utf-8"));
    expect(data.graph).to.have.lengthOf(1);
    expect(data.graph[0].route).to.equal("/");
  });

  after(async function () {
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
