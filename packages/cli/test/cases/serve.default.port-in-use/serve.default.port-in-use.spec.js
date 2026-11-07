import { expect } from "chai";
import { occupyPort, stopServer } from "../../../../../test/server.js";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Serve Greenwood With: Production Server Port Already In Use", function () {
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let preferredPort;
  let hostname;
  const runner = new Runner();
  let blocker;

  before(async function () {
    await runner.setup(outputPath);
    await runner.runCommand(cliPath, "build");

    blocker = await occupyPort();
    preferredPort = blocker.address().port;
    process.env.__GWD_TEST_PORT__ = String(preferredPort);

    await new Promise((resolve, reject) => {
      let output = "";

      runner
        .runCommand(cliPath, "serve", {
          onStdOut: (message) => {
            output += message;
            const ready = output.match(/Started server at (http:\/\/localhost:\d+)\/?\r?\n/);

            if (ready) {
              hostname = ready[1];
              resolve();
            }
          },
        })
        .then(
          () => reject(new Error(`Serve command exited before server readiness:\n${output}`)),
          reject,
        );
    });
  });

  it("should select a port above the occupied production port", function () {
    expect(Number(new URL(hostname).port)).to.be.greaterThan(preferredPort);
  });

  it("should serve static pages on the next available port", async function () {
    const response = await fetch(hostname);

    expect(response.status).to.equal(200);
    expect(await response.text()).to.contain("<h1>Hello World</h1>");
  });

  it("should pass the selected port to API request handlers", async function () {
    const response = await fetch(`${hostname}/api/url`);

    expect(response.status).to.equal(200);
    expect(await response.json()).to.deep.equal({ url: `${hostname}/api/url` });
  });

  after(async function () {
    await stopServer(runner);
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    delete process.env.__GWD_TEST_PORT__;
    await runner.teardown(getOutputTeardownFiles(outputPath));
  });
});
