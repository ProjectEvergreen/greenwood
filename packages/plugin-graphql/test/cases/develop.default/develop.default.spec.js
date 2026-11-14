/*
 * Use Case
 * Run Greenwood develop command with no config.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and process GraphQL (.gql) files as ESM.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * GraphQL Plugin
 *
 * User Workspace
 * src/
 *   data/
 *     queries/
 *       gallery.gql
 *.  pages/
 *     index.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Develop Greenwood With: ", function () {
  const LABEL = "GraphQL plugin for resolving client facing files";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      hostname = await startServer(runner, cliPath, "develop");
      this.context.hostname = hostname;
    });

    describe("Develop command import map for GraphQL", function () {
      let response = {};
      let data;
      let dom;

      before(async function () {
        response = await fetch(`${hostname}`);
        data = await response.text();
        dom = new JSDOM(data);
      });

      it("should return a 200", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("text/html");
      });

      it("should return an import map shim <script> in the <head> of the document", function (done) {
        const importMapTag = dom.window.document.querySelectorAll(
          'head > script[type="importmap"]',
        )[0];
        const importMap = JSON.parse(importMapTag.textContent).imports;

        expect(importMap["@greenwood/plugin-graphql/src/core/client.js"]).to.equal(
          "/node_modules/@greenwood/plugin-graphql/src/core/client.js",
        );
        expect(importMap["@greenwood/plugin-graphql/src/core/common.js"]).to.equal(
          "/node_modules/@greenwood/plugin-graphql/src/core/common.js",
        );
        expect(importMap["@greenwood/plugin-graphql/src/queries/children.gql"]).to.equal(
          "/node_modules/@greenwood/plugin-graphql/src/queries/children.gql",
        );
        expect(importMap["@greenwood/plugin-graphql/src/queries/graph.gql"]).to.equal(
          "/node_modules/@greenwood/plugin-graphql/src/queries/graph.gql",
        );
        expect(importMap["@greenwood/plugin-graphql/src/queries/collection.gql"]).to.equal(
          "/node_modules/@greenwood/plugin-graphql/src/queries/collection.gql",
        );

        done();
      });
    });

    describe("Develop command specific client node_modules resolution", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(
          `${hostname}/node_modules/@greenwood/plugin-graphql/src/core/client.js`,
        );
        data = await response.text();
      });

      it("should return a 200", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("text/javascript");
      });

      it("should return an ECMASCript module", function () {
        expect(data).to.contain("export default client;");
      });
    });

    describe("Develop command specific .gql behaviors", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}/data/queries/gallery.gql`);
        data = await response.text();
      });

      it("should return a 200", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("text/javascript");
      });

      it("should return an ECMASCript module", function () {
        expect(data.trim().indexOf("export default")).to.equal(0);
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown([path.join(outputPath, ".greenwood")]);
  });
});
