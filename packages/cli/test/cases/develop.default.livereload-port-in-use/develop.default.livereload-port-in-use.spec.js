/*
 * Use Case
 * Run Greenwood develop command when the live reload port (35729) is already in use
 * by another process (e.g. a second concurrent `greenwood develop`).
 *
 * User Result
 * Should start the development server on the configured devServer.port and keep serving
 * pages, gracefully disabling live reload with a warning instead of crashing the process.
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
import net from "node:net";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// https://github.com/ProjectEvergreen/greenwood/issues/1717
describe("Develop Greenwood With: ", function () {
  const LABEL = "Live Reload Port (35729) Already In Use";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const port = 1988;
  const liveReloadPort = 35729;
  let runner;
  let blocker;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      // occupy the hardcoded live reload port before Greenwood starts so its bind fails
      blocker = net.createServer();
      await new Promise((resolve, reject) => {
        blocker.once("error", reject);
        blocker.listen(liveReloadPort, resolve);
      });

      await runner.setup(outputPath);

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "develop", {
            onStdOut: (message) => {
              if (
                message.includes(`Started local development server at http://localhost:${port}`)
              ) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Develop command still serving despite live reload port conflict", function () {
      let response = {};
      let body;

      before(async function () {
        // give the (unpatched) server a moment to crash on the unhandled EADDRINUSE if it is going to
        await new Promise((resolve) => setTimeout(resolve, 1000));

        response = await fetch(`${hostname}:${port}/`);
        body = await response.clone().text();
      });

      it("should return a 200 status (dev server did not crash)", function (done) {
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
    await runner.stopCommand();
    await new Promise((resolve) => blocker.close(resolve));
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
