/*
 * Build a static SSR page while the active-content server's configured port is occupied.
 * The render worker should receive the updated config and query the fallback server.
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Active Content Port Already In Use", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const runner = new Runner();
  let blocker;

  before(async function () {
    blocker = net.createServer();
    await new Promise((resolve, reject) => {
      blocker.once("error", reject);
      blocker.listen(1990, resolve);
    });

    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build");
  });

  it("should render using active content from the next available port", async function () {
    const html = await fs.readFile(path.join(outputPath, "public/index.html"), "utf-8");

    expect(html).to.contain("<h1>Active content port: 1991</h1>");
    expect(html).to.contain("<p>Pages: 1</p>");
  });

  after(async function () {
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
