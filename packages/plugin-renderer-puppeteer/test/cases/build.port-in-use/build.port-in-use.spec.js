/*
 * Run a Puppeteer build with occupied active-content and prerender-server ports.
 * Both pages should render using one fallback prerender server, serve active content,
 * and retain the separate active-content server's selected port in their client options.
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { JSDOM } from "jsdom";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Puppeteer and Active Content Ports Already In Use", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const runner = new Runner();
  const preferredContentPort = 1990;
  let blocker;
  let preferredPrerenderPort;
  let selectedPrerenderPort;
  let output = "";

  before(async function () {
    // The fixture occupies Puppeteer's preferred port after active content selects its port.
    blocker = net.createServer();
    await new Promise((resolve, reject) => {
      blocker.once("error", reject);
      blocker.listen(preferredContentPort, resolve);
    });

    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build", {
      onStdOut: (message) => {
        output += message;
      },
    });

    const preferred = output.match(/Puppeteer preferred port: (\d+)/);
    const selected = output.match(
      /Started puppeteer prerender server at http:\/\/localhost:(\d+)\r?\n/,
    );

    expect(preferred).not.to.be.null;
    expect(selected).not.to.be.null;
    preferredPrerenderPort = Number(preferred[1]);
    selectedPrerenderPort = Number(selected[1]);
  });

  it("should start one prerender server on the next available port", function () {
    expect(output.match(/Started puppeteer prerender server at/g)).to.have.lengthOf(1);
    expect(selectedPrerenderPort).to.be.greaterThan(preferredPrerenderPort);
  });

  for (const page of ["index.html", "about/index.html"]) {
    it(`should render ${page} with the selected prerender and content ports`, async function () {
      const html = await fs.readFile(path.join(outputPath, "public", page), "utf-8");
      const { document } = new JSDOM(html).window;

      expect(document.querySelector("#server-origin").textContent).to.equal(
        `http://127.0.0.1:${selectedPrerenderPort}`,
      );
      const contentPort = Number(document.querySelector("#content-port").textContent);

      expect(contentPort).to.be.greaterThan(preferredContentPort);
      expect(contentPort).to.equal(preferredPrerenderPort - 1);
      expect(document.querySelector("#content-count").textContent).to.equal("2");
    });
  }

  after(async function () {
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
