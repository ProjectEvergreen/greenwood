/*
 * Use Case
 * Run Greenwood develop with the GraphQL plugin when its default port is already in use.
 *
 * User Result
 * Should start GraphQL on the next available port and expose that port to browser clients.
 *
 * User Command
 * greenwood develop
 */
import { expect } from "chai";
import net from "node:net";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "GraphQL Server Port Already In Use";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const preferredPort = 4000;
  let devServerUrl;
  let selectedPort;
  let runner;
  let blocker;

  before(function () {
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      blocker = net.createServer();
      await new Promise((resolve, reject) => {
        blocker.once("error", reject);
        blocker.listen(preferredPort, resolve);
      });

      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        let output = "";

        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              // stdout chunks can split startup messages, so wait for a complete CLI-ready line.
              output += message;
              const ready = output.match(
                /Started local development server at (http:\/\/localhost:\d+)\/?\r?\n/,
              );

              if (ready) {
                const graphql = output.match(
                  /GraphQLServer started at http:\/\/localhost:(\d+)\/\r?\n/,
                );

                if (!graphql) {
                  reject(
                    new Error(`Development server started without a GraphQL endpoint:\n${output}`),
                  );
                  return;
                }

                devServerUrl = ready[1];
                selectedPort = Number(graphql[1]);
                resolve();
              }
            },
          })
          .then(
            () => reject(new Error(`Develop command exited before server readiness:\n${output}`)),
            reject,
          );
      });
    });

    it("should select a port above the occupied default port", function () {
      // Earlier tests may have used 4001, so the next available port is not necessarily 4001.
      expect(selectedPort).to.be.greaterThan(preferredPort);
    });

    it("should expose the selected port to browser clients", async function () {
      const response = await fetch(devServerUrl);
      const body = await response.text();

      expect(response.status).to.equal(200);
      expect(body).to.contain(`globalThis.__GWD_GRAPHQL_PORT__ = ${selectedPort}`);
    });

    it("should serve GraphQL queries from the next available port", async function () {
      const response = await fetch(`http://localhost:${selectedPort}/graphql`, {
        method: "POST",
        body: JSON.stringify({
          operationName: null,
          variables: {},
          query: "{ graph { label } }",
        }),
        headers: {
          "content-type": "application/json",
        },
      });
      const data = await response.json();

      expect(response.status).to.equal(200);
      expect(data.data.graph).to.not.be.undefined;
    });
  });

  after(async function () {
    if (runner.childProcess?.exitCode === null && runner.childProcess?.signalCode === null) {
      await runner.stopCommand();
    }
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await runner.teardown([path.join(outputPath, ".greenwood")]);
  });
});
