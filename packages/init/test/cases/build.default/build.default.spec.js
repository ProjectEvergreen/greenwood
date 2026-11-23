/*
 * Use Case
 * Scaffold from minimal template and run Greenwood build command.
 *
 * User Result
 * Should scaffold from template and run the build.
 *
 * User Command
 * npx @greenwood/init --name my-app && greenwood build
 *
 * User Workspace
 * N / A
 */
import { expect } from "chai";
import fs from "node:fs/promises";
import { JSDOM } from "jsdom";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffold Greenwood with default options and run a build";
  const APP_NAME = "my-app";
  const initUrl = new URL("../../../src/index.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const initOutputUrl = new URL(`${APP_NAME}/`, outputUrl);
  let initRunner;
  let greenwoodRunner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", initOutputUrl),
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

    describe(`should build with the Greenwood CLI and have all standard build output files`, function () {
      const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);

      before(async function () {
        await greenwoodRunner.setup(initOutputUrl);
        await greenwoodRunner.runCommand(cliUrl, { args: ["build"] });
      });

      runSmokeTest(["public", "index"], LABEL);

      describe("Build command specific HTML behaviors", function () {
        let dom;

        before(async function () {
          const html = await fs.readFile(new URL("public/index.html", initOutputUrl), "utf-8");

          dom = new JSDOM(html);
        });

        it("should display default project title", function (done) {
          const title = dom.window.document.querySelectorAll("head > title");

          expect(title.length).to.equal(1);
          expect(title[0].textContent).to.equal("Greenwood");

          done();
        });

        it("should have the expected meta charset tag", function (done) {
          const meta = dom.window.document.querySelectorAll("meta[charset='utf-8']");

          expect(meta.length).to.equal(1);

          done();
        });

        it("should have the expected meta viewport tag", function (done) {
          const meta = dom.window.document.querySelectorAll("meta[name='viewport']");

          expect(meta.length).to.equal(1);
          expect(meta[0].getAttribute("content")).to.equal("width=device-width, initial-scale=1");

          done();
        });
      });
    });
  });

  after(async function () {
    await initRunner.teardown([initOutputUrl]);
  });
});
