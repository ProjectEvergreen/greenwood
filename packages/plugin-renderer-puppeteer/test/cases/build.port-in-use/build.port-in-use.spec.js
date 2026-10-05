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
  const blockers = [];
  let output = "";

  before(async function () {
    // Active content falls back from 1990 to 1991; Puppeteer then tries 1992 and uses 1993.
    for (const port of [1990, 1992]) {
      const blocker = net.createServer();
      blockers.push(blocker);
      await new Promise((resolve, reject) => {
        blocker.once("error", reject);
        blocker.listen(port, resolve);
      });
    }

    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build", {
      onStdOut: (message) => {
        output += message;
      },
    });
  });

  it("should start one prerender server on the next available port", function () {
    expect(output.match(/Started puppeteer prerender server at/g)).to.have.lengthOf(1);
    expect(output).to.contain("Started puppeteer prerender server at http://localhost:1993");
  });

  for (const page of ["index.html", "about/index.html"]) {
    it(`should render ${page} with the selected prerender and content ports`, async function () {
      const html = await fs.readFile(path.join(outputPath, "public", page), "utf-8");
      const { document } = new JSDOM(html).window;

      expect(document.querySelector("#server-origin").textContent).to.equal(
        "http://127.0.0.1:1993",
      );
      expect(document.querySelector("#content-port").textContent).to.equal("1991");
      expect(document.querySelector("#content-count").textContent).to.equal("2");
    });
  }

  after(async function () {
    for (const blocker of blockers) {
      if (blocker.listening) {
        await new Promise((resolve) => blocker.close(resolve));
      }
    }
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
