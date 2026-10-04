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
  const devServerUrl = "http://localhost:1984";
  const preferredPort = 4000;
  const availablePort = preferredPort + 1;
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
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (message.includes(`GraphQLServer started at http://localhost:${availablePort}/`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    it("should expose the selected port to browser clients", async function () {
      const response = await fetch(devServerUrl);
      const body = await response.text();

      expect(response.status).to.equal(200);
      expect(body).to.contain(`globalThis.__GWD_GRAPHQL_PORT__ = ${availablePort}`);
    });

    it("should serve GraphQL queries from the next available port", async function () {
      const response = await fetch(`http://localhost:${availablePort}/graphql`, {
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
    await runner.stopCommand();
    await new Promise((resolve) => blocker.close(resolve));
    await runner.teardown([path.join(outputPath, ".greenwood")]);
  });
});
