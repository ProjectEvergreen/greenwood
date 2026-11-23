/*
 * Build a static SSR page while the active-content server's configured port is occupied.
 * The render worker should receive the updated config and query the fallback server.
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import net from "node:net";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Active Content Port Already In Use", function () {
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const runner = new Runner();
  const preferredPort = 1990;
  let blocker;

  before(async function () {
    blocker = net.createServer();
    await new Promise((resolve, reject) => {
      blocker.once("error", reject);
      blocker.listen(preferredPort, resolve);
    });

    await runner.setup(outputUrl);
    await runner.runCommand(cliUrl, { args: "build" });
  });

  it("should render using active content from the next available port", async function () {
    const html = await fs.readFile(new URL("public/index.html", outputUrl), "utf-8");

    const port = html.match(/<h1>Active content port: (\d+)<\/h1>/);

    expect(port).not.to.be.null;
    expect(Number(port[1])).to.be.greaterThan(preferredPort);
    expect(html).to.contain("<p>Pages: 1</p>");
  });

  after(async function () {
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
