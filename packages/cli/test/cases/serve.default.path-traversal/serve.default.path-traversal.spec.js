/*
 * Use Case
 * Run Greenwood serve command and make sure the static file handler cannot be
 * tricked into reading files outside the output directory via `../` traversal.
 *
 * User Result
 * Should return the requested in-root asset, but 404 for any path that resolves
 * outside the output directory.
 *
 * User Command
 * greenwood serve
 *
 * User Config
 * {
 *   port: 8182
 * }
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   assets/
 *     data.json
 * secret-outside-webroot.json  (sibling of the build output, must never be served)
 *
 * https://github.com/ProjectEvergreen/greenwood/issues/1748
 */
import { expect } from "chai";
import net from "node:net";
import path from "node:path";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

// fetch()/WHATWG URL normalize `..` client-side, so use a raw socket to send the
// literal request target an attacker would send (e.g. curl --path-as-is).
function rawRequest(port, requestTarget) {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      socket.write(`GET ${requestTarget} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n`);
    });
    let raw = "";
    socket.on("data", (chunk) => (raw += chunk));
    socket.on("error", reject);
    socket.on("end", () => {
      const [head, body = ""] = raw.split("\r\n\r\n");
      const status = Number(head.split("\r\n")[0].split(" ")[1]);
      resolve({ status, body });
    });
  });
}

describe("Serve Greenwood With: ", function () {
  const LABEL = "Path traversal protection for the static file handler";
  const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");
  const outputPath = fileURLToPath(new URL(".", import.meta.url));
  const hostname = "http://localhost:8182";
  const port = 8182;
  let runner;

  before(function () {
    this.context = {
      hostname,
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputPath);
      await runner.runCommand(cliPath, "build");

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliPath, "serve", {
            onStdOut: (message) => {
              if (message.includes(`Started server at ${hostname}`)) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("a legitimate in-root static asset", function () {
      let response;

      before(async function () {
        response = await rawRequest(port, "/assets/data.json");
      });

      it("should return a 200 status", function () {
        expect(response.status).to.equal(200);
      });

      it("should return the asset contents", function () {
        expect(response.body).to.contain("world-in-root-asset");
      });
    });

    describe("a `../` traversal to a file outside the output directory", function () {
      let response;

      before(async function () {
        response = await rawRequest(port, "/../secret-outside-webroot.json");
      });

      it("should return a 404 status", function () {
        expect(response.status).to.equal(404);
      });

      it("should not leak the out-of-root file contents", function () {
        expect(response.body).to.not.contain("THIS_FILE_IS_OUTSIDE_THE_WEB_ROOT");
      });
    });

    describe("a percent-encoded `..` traversal", function () {
      let response;

      before(async function () {
        response = await rawRequest(port, "/%2e%2e/secret-outside-webroot.json");
      });

      it("should return a 404 status", function () {
        expect(response.status).to.equal(404);
      });

      it("should not leak the out-of-root file contents", function () {
        expect(response.body).to.not.contain("THIS_FILE_IS_OUTSIDE_THE_WEB_ROOT");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputPath));
    await runner.stopCommand();
  });
});
