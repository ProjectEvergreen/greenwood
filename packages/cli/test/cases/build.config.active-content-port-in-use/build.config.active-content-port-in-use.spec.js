/*
 * Build a static SSR page while the active-content server's configured port is occupied.
 * The render worker should receive the updated config and query the fallback server.
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { occupyPort } from "../../../../../test/server.js";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Active Content Port Already In Use", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const runner = new Runner();
  let preferredPort;
  let blocker;

  before(async function () {
    blocker = await occupyPort();
    preferredPort = blocker.address().port;
    process.env.__GWD_TEST_PORT__ = String(preferredPort);

    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build");
  });

  it("should render using active content from the next available port", async function () {
    const html = await fs.readFile(path.join(outputPath, "public/index.html"), "utf-8");

    const port = html.match(/<h1>Active content port: (\d+)<\/h1>/);

    expect(port).not.to.be.null;
    expect(Number(port[1])).to.be.greaterThan(preferredPort);
    expect(html).to.contain("<p>Pages: 1</p>");
  });

  after(async function () {
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    delete process.env.__GWD_TEST_PORT__;
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
