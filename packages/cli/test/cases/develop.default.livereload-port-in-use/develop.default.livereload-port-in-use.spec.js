/*
 * Use Case
 * Run Greenwood develop command when the live reload port (35729) is already in use
 * by another process (e.g. a second concurrent `greenwood develop`).
 *
 * User Result
 * Should start the development server on the configured devServer.port and keep serving
 * pages, using the next available port for live reload.
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
  const liveReloadPort = 35729;
  let hostname;
  let selectedLiveReloadPort;
  let runner;
  let blocker;

  before(function () {
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      // occupy the default live reload port before Greenwood starts
      blocker = net.createServer();
      await new Promise((resolve, reject) => {
        blocker.once("error", reject);
        blocker.listen(liveReloadPort, resolve);
      });

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

    describe("Develop command using the next available live reload port", function () {
      let response = {};
      let liveReloadResponse = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}/`);
        body = await response.clone().text();
        const script = body.match(/http:\/\/localhost:(\d+)\/livereload\.js\?snipver=1/);

        expect(script).not.to.be.null;
        selectedLiveReloadPort = Number(script[1]);
        liveReloadResponse = await fetch(script[0]);
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

      it("should inject the next available live reload port", function (done) {
        expect(selectedLiveReloadPort).to.be.greaterThan(liveReloadPort);
        done();
      });

      it("should serve the live reload client from the next available port", function (done) {
        expect(liveReloadResponse.status).to.equal(200);
        done();
      });
    });
  });

  after(async function () {
    if (runner.childProcess?.exitCode === null && runner.childProcess?.signalCode === null) {
      await runner.stopCommand();
    }
    if (blocker?.listening) {
      await new Promise((resolve) => blocker.close(resolve));
    }
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
