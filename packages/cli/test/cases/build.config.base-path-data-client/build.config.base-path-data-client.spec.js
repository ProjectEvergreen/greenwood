/*
 * Use Case
 * Run Greenwood build command with both base path and active content configuration set (no prerendering).
 *
 * User Result
 * Should generate a Greenwood build where the bundled data client fetches graph.json prefixed
 * with the configured base path, instead of from the root of the domain.
 * https://github.com/ProjectEvergreen/greenwood/issues/1738
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   activeContent: true,
 *   basePath: '/my-path'
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
import fs from "node:fs";
import glob from "glob-promise";
import { JSDOM } from "jsdom";
import path from "node:path";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Build Greenwood With: ", function () {
  const LABEL = "Base Path Configuration with Content as Data";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const basePath = "/my-path";
  let runner;

  before(function () {
    this.context = {
      publicDir: path.join(outputPath, "public"),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");
    });

    runSmokeTest(["public", "index"], LABEL);

    describe("Graph data emitted to the output directory", function () {
      it("should emit graph.json at the root of the output directory", function () {
        expect(fs.existsSync(path.join(this.context.publicDir, "graph.json"))).to.equal(true);
      });
    });

    describe("Index page <script> tag setup for base path and active content", function () {
      let dom;

      before(async function () {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, "index.html"));
      });

      it("should have a <script> tag for tracking base path configuration", function () {
        const basePathScript = Array.from(
          dom.window.document.querySelectorAll("head > script"),
        ).filter((tag) => tag.getAttribute("data-gwd") === "base-path");

        expect(basePathScript.length).to.equal(1);
        expect(basePathScript[0].textContent).to.contain(
          `globalThis.__GWD_BASE_PATH__="${basePath}"`,
        );
      });

      it("should have a <script> tag that confirms content as data is set", function () {
        const stateScripts = dom.window.document.querySelectorAll("script#content-as-data-state");

        expect(stateScripts.length).to.equal(1);
        expect(stateScripts[0].textContent).to.contain(
          "globalThis.__CONTENT_AS_DATA_STATE__ = true;",
        );
      });
    });

    describe("Bundled data client fetching of graph.json", function () {
      let bundledClientContents;

      before(async function () {
        const bundledJs = await glob(path.join(this.context.publicDir, "header.*.js"));

        bundledClientContents = fs.readFileSync(bundledJs[0], "utf-8");
      });

      it("should resolve the base path from the injected global at runtime", function () {
        expect(bundledClientContents).to.contain("__GWD_BASE_PATH__");
      });

      // https://github.com/ProjectEvergreen/greenwood/issues/1738
      it("should fetch graph.json prefixed with the base path", function () {
        expect(bundledClientContents).to.match(/fetch\(`\$\{[a-zA-Z_$][\w$]*\}\/graph\.json`\)/);
      });

      it("should not fetch graph.json from the root of the domain", function () {
        expect(bundledClientContents).to.not.contain('fetch("/graph.json")');
      });
    });
  });

  after(function () {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
