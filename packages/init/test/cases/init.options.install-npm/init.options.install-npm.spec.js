/*
 * Use Case
 * Scaffold from minimal template and install dependencies with npm.
 *
 * User Result
 * Should scaffold from template and with lockfile.
 *
 * User Command
 * npx @greenwood/init --name=my-app --install npm
 *
 * User Workspace
 * N / A
 */
import chai from "chai";
import fs from "node:fs";
import path from "node:path";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffolding a new project with dependencies installed through NPM";
  const APP_NAME = "my-app";
  const initPath = path.join(process.cwd(), "packages/init/src/index.js");
  const outputPath = path.dirname(fileURLToPath(new URL(import.meta.url)));
  const initOutputPath = path.join(outputPath, `/${APP_NAME}`);
  let initRunner;
  let greenwoodRunner;

  before(function () {
    this.context = {
      publicDir: path.join(initOutputPath, "public"),
    };
    initRunner = new Runner();
    greenwoodRunner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      await initRunner.setup(outputPath, [], { create: false });
      await initRunner.runCommand(initPath, ["--name", APP_NAME, "-i", "npm", "--ts", "no"]);
    });

    describe("should install with npm", function () {
      const cliPath = path.join(process.cwd(), "packages/cli/src/bin.js");

      before(async function () {
        await greenwoodRunner.setup(initOutputPath);
        await greenwoodRunner.runCommand(cliPath, "build");
      });

      runSmokeTest(["public", "index"], LABEL);

      it("should generate a package-lock.json file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "package-lock.json"))).to.be.true;
      });

      it("should generate a .npmrc file with the expected contents", function () {
        const npmrcPath = path.join(initOutputPath, ".npmrc");
        const contents = fs.readFileSync(npmrcPath, "utf-8");

        expect(fs.existsSync(npmrcPath)).to.be.true;
        expect(contents).contains("legacy-peer-deps=true");
      });
    });
  });

  after(async function () {
    await initRunner.teardown([initOutputPath]);
  });
});
