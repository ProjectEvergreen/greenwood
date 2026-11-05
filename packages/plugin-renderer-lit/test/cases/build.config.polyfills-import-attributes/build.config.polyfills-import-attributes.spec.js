/*
 * Use Case
 * Build a Lit app with the CSS import attributes polyfill and an API route that registers Lit's CSS hoo, reduced from ProjectEvergreen/greenwood-lit-ssr.
 *
 * User Result
 * Rollup should bundle the API route without corrupting Lit's runtime CSS-import
 * support detection, while still polyfilling the component's static CSS import.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * ```
 * import { greenwoodPluginRendererLit } from "@greenwood/plugin-renderer-lit";
 *
 * export default {
 *   polyfills: { importAttributes: ['css'] }
 *   plugins: [greenwoodPluginRendererLit()]
 * }
 * ```
 *
 * User Workspace
 * src/
 *   components/card/
 *     card.js
 *     card.css
 *   pages/
 *     api/fragment.js
 *     index.html
 * greenwood.config.js
 * package.json
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Build Greenwood With Lit and the CSS import attributes polyfill", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputUrl = new URL(".", import.meta.url);
  const outputPath = fileURLToPath(outputUrl);
  let runner;
  let apiContents;

  before(async function () {
    runner = new Runner();
    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build");
    apiContents = await fs.readFile(new URL("./public/api/fragment.js", outputUrl), "utf-8");
  });

  it("should preserve Lit's dynamic CSS import specifier and attributes in the API bundle", function () {
    expect(apiContents).to.match(
      /import\(inlineCSS,\s*\{\s*with:\s*\{\s*type: ['"]css['"]\s*\}\s*\}\)/,
    );
    expect(apiContents).to.contain("data:text/css;base64,cHt0b3A6MDt9");
    expect(apiContents).to.not.contain("inlineCS?polyfill=type-cssS");
  });

  it("should polyfill the card's static CSS import in the API bundle", function () {
    expect(apiContents).to.contain("replaceSync(`:host{color:purple}`)");
  });

  it("should polyfill the card's CSS in the browser bundle referenced by the page", async function () {
    const html = await fs.readFile(new URL("./public/index.html", outputUrl), "utf-8");
    const dom = new JSDOM(html);
    const scripts = dom.window.document.querySelectorAll("script[src]");

    expect(scripts).to.have.lengthOf(1);

    const contents = await fs.readFile(
      new URL(`./public${scripts[0].getAttribute("src")}`, outputUrl),
      "utf-8",
    );

    expect(contents).to.contain('replaceSync(":host{color:purple}")');
    expect(contents).to.not.contain("?polyfill=type-css");
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
