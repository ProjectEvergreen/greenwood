import { expect } from "chai";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Runner } from "gallinago";
import { occupyPort, startServer, stopServer } from "../../../../../test/server.js";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Develop Greenwood With: Concurrent GraphQL Servers", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const runners = [new Runner(false, true), new Runner(false, true)];
  const workspaces = ["one", "two"].map((name) => path.join(outputPath, name));
  let blocker;
  let endpoints;

  before(async function () {
    blocker = await occupyPort(4000);
    endpoints = await Promise.all(
      runners.map(async (runner, index) => {
        await runner.setup(workspaces[index]);
        return startServer(runner, cliPath, "develop", {
          pattern: /GraphQLServer started at (http:\/\/\S+)\r?\n/,
        });
      }),
    );
  });

  it("should bind distinct fallback ports when two GraphQL servers start together", function () {
    expect(endpoints[0]).not.to.equal(endpoints[1]);
    for (const endpoint of endpoints) {
      expect(Number(new URL(endpoint).port)).to.be.greaterThan(4000);
    }
  });

  it("should query each server's own project", async function () {
    const graphs = await Promise.all(
      endpoints.map(async (endpoint) => {
        const response = await fetch(`${endpoint}/graphql`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query: "{ graph { route } }" }),
        });
        expect(response.status).to.equal(200);
        const result = await response.json();
        return result.data.graph;
      }),
    );

    expect(graphs[0].map((page) => page.route)).to.deep.equal(["/"]);
    expect(graphs[1].map((page) => page.route)).to.have.members(["/", "/about/"]);
  });

  after(async function () {
    await Promise.all(runners.map((runner) => stopServer(runner)));
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await Promise.all(
      runners.map((runner, index) => runner.teardown(getOutputTeardownFiles(workspaces[index]))),
    );
  });
});
