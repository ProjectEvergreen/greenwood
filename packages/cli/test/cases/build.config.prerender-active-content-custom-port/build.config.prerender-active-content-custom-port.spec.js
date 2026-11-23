/*
 * Use Case
 * Run Greenwood build command with prerendering, active content, and a custom dev server port.
 *
 * User Result
 * Should prerender navigation using the Content-as-Data client on the configured dev server port.
 * https://github.com/ProjectEvergreen/greenwood/issues/1334
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   activeContent: true,
 *   prerender: true,
 *   devServer: {
 *     port: 8181
 *   }
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With: Prerendered Active Content on a Custom Port", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));

  const runner = new Runner();

  before(async function () {
    await runner.setup(outputPath);
    await runner.runCommand(cliPath, { args: "build" });
  });

  it("should prerender navigation from the data client using the custom dev server port", async function () {
    const html = await fs.readFile(path.join(outputPath, "public/index.html"), "utf-8");
    const dom = new JSDOM(html);
    const links = dom.window.document.querySelectorAll("app-header nav a");

    expect(links).to.have.length(1);
    expect(links[0].getAttribute("href")).to.equal("/");
    expect(links[0].textContent).to.equal("Home");
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
