/*
 * Use Case
 * Run Greenwood develop command when the configured development server port is already in use.
 *
 * User Result
 * Should start the development server on the next available port and serve pages without crashing.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * devServer: {
 *   port: 1988,
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 */
import { expect } from "chai";
import { occupyPort, stopServer } from "../../../../../test/server.js";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Development Server Port Already In Use";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  let preferredPort;
  let hostname;
  let runner;
  let blocker;

  before(function () {
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      blocker = await occupyPort();
      preferredPort = blocker.address().port;
      process.env.__GWD_TEST_PORT__ = String(preferredPort);

      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        let output = "";

        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              output += message;
              const ready = output.match(
                /Started local development server at (http:\/\/localhost:\d+)\/?\r?\n/,
              );

              if (ready) {
                hostname = ready[1];
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

    describe("Develop command using the next available port", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
      });

      it("should select a port above the occupied development port", function () {
        expect(Number(new URL(hostname).port)).to.be.greaterThan(preferredPort);
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return the expected page content", function (done) {
        expect(body).to.contain("<h1>Hello World</h1>");
        done();
      });
    });
  });

  after(async function () {
    await stopServer(runner);
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    delete process.env.__GWD_TEST_PORT__;
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
