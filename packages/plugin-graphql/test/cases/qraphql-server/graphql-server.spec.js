/*
 * Use Case
 * Run Greenwood develop command with GraphQL plugin and test the GraphQL server.
 *
 * User Result
 * Should start in development and serve the GraphQL server.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * GraphQL Plugin
 *
 * User Workspace
 * Greenwood default (src/)
 */
import { expect } from "chai";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Develop Greenwood With: ", function () {
  const LABEL = "GraphQL Server";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let hostname;
  let runner;

  before(function () {
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);

      hostname = await startServer(runner, cliPath, "develop", {
        pattern: /GraphQLServer started at (http:\/\/\S+)\r?\n/,
      });
    });

    // ping the graphql server
    describe("GraphQL server / playground running", function () {
      let response = {
        body: "",
        code: 0,
      };

      before(async function () {
        response = await fetch(`${hostname}`, {
          headers: {
            accept: "text/html",
          },
        });
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.contain("text/html");
      });
    });

    // test a query call
    describe("Develop command with GraphQL server and running a query", function () {
      let response = {
        body: "",
        code: 0,
      };
      let data;

      const body = {
        operationName: null,
        variables: {},
        query: "{\n  graph {\n    label\n  }\n}\n",
      };

      before(async function () {
        response = await fetch(`${hostname}/graphql`, {
          method: "POST",
          body: JSON.stringify(body),
          headers: {
            "content-type": "application/json",
          },
        });
        data = await response.json();
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.equal("application/json; charset=utf-8");
      });

      it("should return the expected query response", function () {
        expect(data.data.graph).to.not.be.undefined;
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown([path.join(outputPath, ".greenwood"), path.join(outputPath, "public")]);
  });
});
