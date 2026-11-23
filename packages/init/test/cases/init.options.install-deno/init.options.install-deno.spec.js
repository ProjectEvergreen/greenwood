/*
 * Use Case
 * Scaffold from minimal template and install dependencies with Deno.
 *
 * User Result
 * Should scaffold from template and with lockfile.
 *
 * User Command
 * npx @greenwood/init --name=my-app --install deno
 *
 * User Workspace
 * N / A
 */
import { expect } from "chai";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { Runner } from "gallinago";
import { runSmokeTest } from "../../../../../test/smoke-test.js";

describe("Initialize a new Greenwood project: ", function () {
  const LABEL = "Scaffolding a new project with dependencies installed through Deno";
  const APP_NAME = "my-app";
  const initUrl = new URL("../../../src/index.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const initOutputUrl = new URL(`${APP_NAME}/`, outputUrl);
  let initRunner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", initOutputUrl),
    };
    initRunner = new Runner({ enableStdOut: true });
  });

  describe(LABEL, function () {
    before(async function () {
      await initRunner.setup(outputUrl, { create: false });
      await initRunner.runCommand(initUrl, {
        args: ["--name", APP_NAME, "--install", "deno", "--ts", "no"],
      });
    });

    it("should generate a deno.lock file", function () {
      expect(fs.existsSync(new URL("deno.lock", initOutputUrl))).to.be.true;
    });

    it("should generate a deno.jsonc file", function () {
      const denoConfigUrl = new URL("deno.jsonc", initOutputUrl);
      const denoConfigContents = JSON.parse(fs.readFileSync(denoConfigUrl, "utf-8"));

      expect(fs.existsSync(denoConfigUrl)).to.be.true;
      expect(denoConfigContents.preferPackageJson).to.equal(true);
      expect(denoConfigContents.minimumDependencyAge).to.deep.equal({
        age: "P1D",
        exclude: ["npm:@greenwood/cli"],
      });
      expect(denoConfigContents.exclude).to.deep.equal([".deno-deploy/", ".greenwood/", "public/"]);
    });

    it("should scaffold Greenwood NPM scripts with Deno permissions", function () {
      const { scripts } = JSON.parse(
        fs.readFileSync(new URL("package.json", initOutputUrl), "utf-8"),
      );
      const baseCommand = "deno run --allow-read --allow-sys --allow-env --allow-write --allow-ffi";

      expect(scripts.dev).to.equal(
        "deno run --allow-read --allow-sys --allow-env --allow-write --allow-net npm:@greenwood/cli develop",
      );
      expect(scripts.start).to.equal(scripts.dev);
      expect(scripts.build).to.equal(`${baseCommand} npm:@greenwood/cli build`);
      expect(scripts.serve).to.equal("greenwood serve");
    });

    // https://github.com/ProjectEvergreen/greenwood/discussions/1810
    it("should install @rollup/wasm-node", function () {
      const packageJsonUrl = new URL("package.json", initOutputUrl);
      const packageJsonContents = JSON.parse(fs.readFileSync(packageJsonUrl, "utf-8"));

      expect(packageJsonContents.devDependencies["@rollup/wasm-node"]).to.equal("^4.59.0");
    });

    it("should not generate a .npmrc file", function () {
      const npmrcUrl = new URL(".npmrc", initOutputUrl);

      expect(fs.existsSync(npmrcUrl)).to.be.false;
    });

    it("should build with Deno", function () {
      const result = spawnSync("deno", ["task", "build"], {
        cwd: initOutputUrl,
        encoding: "utf-8",
      });

      expect(result.error).to.be.undefined;
      expect(result.status, result.stderr).to.equal(0);
    });

    runSmokeTest(["public", "index"], LABEL);
  });

  after(async function () {
    await initRunner.teardown([initOutputUrl]);
  });
});
