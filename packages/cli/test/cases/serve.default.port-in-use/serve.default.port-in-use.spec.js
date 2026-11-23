import { expect } from "chai";
import net from "node:net";
import { Runner } from "gallinago";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";

describe("Serve Greenwood With: Production Server Port Already In Use", function () {
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const preferredPort = 8183;
  let hostname;
  const runner = new Runner();
  let blocker;

  before(async function () {
    await runner.setup(outputUrl);
    await runner.runCommand(cliUrl, { args: "build" });

    blocker = net.createServer();
    await new Promise((resolve, reject) => {
      blocker.once("error", reject);
      blocker.listen(preferredPort, resolve);
    });

    await new Promise((resolve, reject) => {
      let output = "";

      runner
        .runCommand(cliUrl, {
          args: "serve",
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
    if (runner.childProcess?.exitCode === null && runner.childProcess?.signalCode === null) {
      await runner.stopCommand();
    }
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
