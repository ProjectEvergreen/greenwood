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
import { Runner } from "gallinago";

describe("Develop Greenwood With: ", function () {
  const LABEL = "TypeScript support for resolving .ts files";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://localhost";
  const port = 1984;
  let runner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliUrl, {
            args: "develop",
            onStdOut: (message) => {
              if (message.includes(`Started local development server at http://localhost:1984`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Develop command specific .ts behaviors", function () {
      let response = {};
      let data;

      before(async function () {
        response = await fetch(`${hostname}:${port}/main.ts`, {
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
    await runner.stopCommand();
    await runner.teardown([new URL(".greenwood", outputUrl)]);
  });
});
