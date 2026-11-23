/*
 * Use Case
 * Scaffold from minimal template and run Greenwood develop command with no config.
 *
 * User Result
 * Should scaffold from template and start the development server and render the template.
 *
 * User Command
 * @greenwood/init --name my-app && greenwood develop
 *
 * User Workspace
 * N / A
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffold Greenwood with default options and run the development server";
  const APP_NAME = "my-app";
  const initUrl = new URL("../../../src/index.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const initOutputUrl = new URL(`${APP_NAME}/`, outputUrl);
  const hostname = "http://localhost";
  const port = 1984;
  let initRunner;
  let greenwoodRunner;

  before(function () {
    this.context = {
      hostname: `${hostname}:${port}`,
    };
    initRunner = new Runner();
    greenwoodRunner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await initRunner.setup(outputUrl, { create: false });
      await initRunner.runCommand(initUrl, {
        args: ["--name", APP_NAME, "--ts", "no", "--install", "no"],
      });
    });

    describe("should run the Greenwood dev server", function () {
      const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);

      before(async function () {
        await greenwoodRunner.setup(initOutputUrl);

        await new Promise((resolve, reject) => {
          greenwoodRunner
            .runCommand(cliUrl, {
              args: "develop",
              onStdOut: (message) => {
                if (message.includes(`Started local development server at http://localhost:1984`)) {
                  resolve();
                }
              },
            })
            .catch(reject);
        });
      });

      runSmokeTest(["serve"], LABEL);

      describe("Develop command specific HTML behaviors", function () {
        let response = {};
        let dom;

        before(async function () {
          response = await fetch(`${hostname}:${port}/`);
          const data = await response.text();

          dom = new JSDOM(data);
        });

        it("should return the correct content type", function (done) {
          expect(response.headers.get("content-type")).to.equal("text/html");
          done();
        });

        it("should return a 200", function (done) {
          expect(response.status).to.equal(200);

          done();
        });

        it("should display default project title", function (done) {
          const title = dom.window.document.querySelector("head > title");

          expect(title.textContent).to.equal("Greenwood");

          done();
        });
      });
    });
  });

  after(async function () {
    await greenwoodRunner.stopCommand();
    await initRunner.teardown([initOutputUrl]);
  });
});
