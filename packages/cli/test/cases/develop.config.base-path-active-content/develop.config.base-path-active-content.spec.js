/*
 * Use Case
 * Run Greenwood develop command with both base path and active content configuration set.
 *
 * User Result
 * Should start the development server with the content as data state scripts injected under
 * the base path, and serve ___graph.json from the base path for the data client.
 * https://github.com/ProjectEvergreen/greenwood/issues/1738
 *
 * User Command
 * greenwood develop
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
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Base Path Configuration with Active Content";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1984;
  const basePath = "/my-path";
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes(`Started local development server at http://localhost:1984`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Index page <script> tag setup for base path and active content", function () {
      let response = {};
      let dom;

      before(async function () {
        response = await fetch(`${hostname}:${port}${basePath}/`, {
          headers: {
            accept: "text/html",
          },
        });

        dom = new JSDOM(await response.clone().text());
      });

      it("should return a 200 with the correct content type", function (done) {
        expect(response.status).to.equal(200);
        expect(response.headers.get("content-type")).to.contain("text/html");
        done();
      });

      it("should have a <script> tag for tracking base path configuration", function (done) {
        const basePathScript = Array.from(
          dom.window.document.querySelectorAll("head > script"),
        ).filter((tag) => tag.getAttribute("data-gwd") === "base-path");

        expect(basePathScript.length).to.equal(1);
        expect(basePathScript[0].textContent).to.contain(
          `globalThis.__GWD_BASE_PATH__ = '${basePath}'`,
        );
        done();
      });

      it("should have a <script> tag with the data client options for develop mode", function (done) {
        const optionsScripts = dom.window.document.querySelectorAll("script#data-client-options");

        expect(optionsScripts.length).to.equal(1);
        expect(optionsScripts[0].textContent).to.contain("globalThis.__CONTENT_OPTIONS__");
        expect(optionsScripts[0].textContent).to.contain(`PORT: ${port}`);
        done();
      });
    });

    // the develop mode data client fetches ___graph.json prefixed with the base path
    // https://github.com/ProjectEvergreen/greenwood/issues/1738
    describe("Dev server serving of ___graph.json for the data client", function () {
      let response = {};
      let graph;

      before(async function () {
        response = await fetch(`${hostname}:${port}${basePath}/___graph.json`, {
          headers: { "X-CONTENT-KEY": "graph" },
        });
        graph = await response.clone().json();
      });

      it("should return a 200 with the correct content type", function (done) {
        expect(response.status).to.equal(200);
        expect(response.headers.get("content-type")).to.contain("application/json");
        done();
      });

      it("should return the graph with the index page route prefixed with the base path", function (done) {
        expect(graph).to.have.lengthOf(1);
        expect(graph[0].route).to.equal(`${basePath}/`);
        done();
      });
    });

    describe("Develop command specific JavaScript behaviors for user authored custom element", function () {
      let response = {};
      let body = "";

      before(async function () {
        response = await fetch(`${hostname}:${port}${basePath}/components/header.js`);
        body = await response.clone().text();
      });

      it("should return a 200 status with the correct content type", function (done) {
        expect(response.status).to.equal(200);
        expect(response.headers.get("content-type")).to.contain("text/javascript");
        done();
      });

      it("should return the correct response body", function (done) {
        expect(body).to.contain("class Header extends HTMLElement");
        done();
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
