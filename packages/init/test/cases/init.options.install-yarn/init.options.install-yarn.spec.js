/*
 * Use Case
 * Scaffold from minimal template and install dependencies with Yarn.
 *
 * User Result
 * Should scaffold from template and with lockfile.
 *
 * User Command
 * npx @greenwood/init --name=my-app --install yarn
 *
 * User Workspace
 * N / A
 */
import { expect } from "chai";
import fs from "node:fs";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffolding a new project with dependencies installed through Yarn";
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
        args: ["--name", APP_NAME, "--install", "yarn", "--ts", "no"],
      });
    });

    describe("should install with Yarn", function () {
      const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);

      before(async function () {
        await greenwoodRunner.setup(initOutputUrl);
        await greenwoodRunner.runCommand(cliUrl, { args: "build" });
      });

      runSmokeTest(["public", "index"], LABEL);

      it("should generate a yarn.lock file", function () {
        expect(fs.existsSync(new URL("yarn.lock", initOutputUrl))).to.be.true;
      });

      it("should not generate a .npmrc file", function () {
        const npmrcUrl = new URL(".npmrc", initOutputUrl);

        expect(fs.existsSync(npmrcUrl)).to.be.false;
      });
    });
  });

  after(async function () {
    await greenwoodRunner.teardown([initOutputUrl]);
  });
});
