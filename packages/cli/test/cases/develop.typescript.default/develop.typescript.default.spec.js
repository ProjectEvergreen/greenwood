/*
 * Use Case
 * Run Greenwood develop command with no config and TypeScript processing.
 *
 * User Result
 * Should start the development server and render a bare bones Greenwood build and process TypeScript (.ts) files.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * N / A
 *
 * User Workspace
 * src/
 *   main.ts
 *
 */
import { expect } from "chai";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { startServer, stopServer } from "../../../../../test/server.js";

describe("Develop Greenwood With: ", function () {
  const LABEL = "TypeScript support for resolving .ts files";
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

    describe("Develop command specific .ts behaviors", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}/main.ts`, {
          headers: {
            Accept: "text/javascript",
          },
        });
        data = await response.text();
      });

      it("should return a 200", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the correct content type", function () {
        expect(response.headers.get("content-type")).to.contain("text/javascript");
      });

      it("should return an ECMAScript module", function () {
        expect(data.trim().indexOf("const user")).to.equal(0);
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    await runner.teardown([path.join(outputPath, ".greenwood")]);
  });
});
