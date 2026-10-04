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
import net from "node:net";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Development Server Port Already In Use";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost";
  const preferredPort = 1988;
  const availablePort = preferredPort + 1;
  let runner;
  let blocker;

  before(function () {
    this.context = {
      hostname: `${hostname}:${availablePort}`,
    };
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
              if (
                message.includes(`Started local development server at ${hostname}:${availablePort}`)
              ) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Develop command using the next available port", function () {
      let response = {};
      let body;

      before(async function () {
        response = await fetch(`${hostname}:${availablePort}/`);
        body = await response.clone().text();
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
    await runner.stopCommand();
    await new Promise((resolve) => blocker.close(resolve));
    await runner.teardown([
      path.join(outputPath, ".greenwood"),
      path.join(outputPath, "node_modules"),
    ]);
  });
});
