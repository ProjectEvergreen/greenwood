/*
 * Use Case
 * Scaffold from minimal template and install dependencies with pnpm.
 *
 * User Result
 * Should scaffold from template and with lockfile.
 *
 * User Command
 * npx @greenwood/init --name=my-app --install pnpm
 *
 * User Workspace
 * N / A
 */
import { expect } from "chai";
import fs from "node:fs";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffolding a new project with dependencies installed through PNPM";
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
        args: ["--name", APP_NAME, "--install", "pnpm", "--ts", "no"],
      });
    });

    describe("should install with pnpm", function () {
      const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);

      before(async function () {
        await greenwoodRunner.setup(initOutputUrl);
        await greenwoodRunner.runCommand(cliUrl, { args: "build" });
      });

      runSmokeTest(["public", "index"], LABEL);

      it("should generate a pnpm-lock.yaml file", function () {
        expect(fs.existsSync(new URL("pnpm-lock.yaml", initOutputUrl))).to.be.true;
      });

      it("should generate a .npmrc file with the expected contents", function () {
        const npmrcUrl = new URL(".npmrc", initOutputUrl);
        const contents = fs.readFileSync(npmrcUrl, "utf-8");

        expect(fs.existsSync(npmrcUrl)).to.be.true;
        expect(contents).contains("shamefully-hoist=true");
      });
    });
  });

  after(async function () {
    await initRunner.teardown([initOutputUrl]);
  });
});
