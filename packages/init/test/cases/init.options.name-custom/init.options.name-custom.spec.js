/*
 * Use Case
 * Scaffold from minimal template with a custom project name flag.
 *
 * User Result
 * Should scaffold from template build.
 *
 * User Command
 * * npx @greenwood/init --name my-project
 *
 * User Workspace
 * N / A
 */
import { expect } from "chai";
import fs from "node:fs";
import { Runner } from "gallinago";

describe("Initialize a new Greenwood project: ", function () {
  const APP_NAME = "my-project";
  const initUrl = new URL("../../../src/index.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const initOutputUrl = new URL(`${APP_NAME}/`, outputUrl);
  let runner;

  before(function () {
    this.context = {
      publicDir: outputUrl,
    };
    runner = new Runner();
  });

  describe("Scaffolding a new project with custom project name", function () {
    before(async function () {
      await runner.setup(outputUrl, { create: false });
      await runner.runCommand(initUrl, {
        args: ["--name", APP_NAME, "--ts", "no", "--install", "no"],
      });
    });

    describe("project files and folders", () => {
      it("should create a src/pages directory", function () {
        expect(fs.existsSync(new URL("src/pages", initOutputUrl))).to.be.true;
      });

      it("should generate a .gitignore file", function () {
        expect(fs.existsSync(new URL(".gitignore", initOutputUrl))).to.be.true;
      });

      it("should generate a package.json file", function () {
        expect(fs.existsSync(new URL("package.json", initOutputUrl))).to.be.true;
      });

      it("should not generate a package-lock.json file", function () {
        expect(fs.existsSync(new URL("package-lock.json", initOutputUrl))).to.be.false;
      });

      it("should not generate a yarn.lock file", function () {
        expect(fs.existsSync(new URL("yarn.lock", initOutputUrl))).to.be.false;
      });

      it("should not generate a pnpm-lock.yaml file", function () {
        expect(fs.existsSync(new URL("pnpm-lock.yaml", initOutputUrl))).to.be.false;
      });

      it("should not generate a public directory", function () {
        expect(fs.existsSync(new URL("public", initOutputUrl))).to.be.false;
      });
    });

    describe("initial package.json contents", function () {
      let pkgJson;

      before(function () {
        pkgJson = JSON.parse(fs.readFileSync(new URL("package.json", initOutputUrl), "utf-8"));
      });

      it("the should have the correct type", function () {
        expect(pkgJson.type).to.equal("module");
      });

      it("the should have the correct name", function () {
        expect(pkgJson.name).to.equal(APP_NAME);
      });

      it("the should have the correct Greenwood scripts", function () {
        const scripts = pkgJson.scripts;

        expect(scripts.dev).to.equal("greenwood develop");
        expect(scripts.start).to.equal(scripts.dev);
        expect(scripts.build).to.equal("greenwood build");
        expect(scripts.serve).to.equal("greenwood serve");
      });

      it("the should have the correct Greenwood devDependency", function () {
        const scriptPkg = JSON.parse(
          fs.readFileSync(new URL("../../../package.json", import.meta.url), "utf-8"),
        );

        expect(pkgJson.devDependencies["@greenwood/cli"]).to.equal(`~${scriptPkg.version}`);
      });
    });

    describe("home page contents", function () {
      let pageContents;

      before(async function () {
        pageContents = fs.readFileSync(new URL("src/pages/index.html", initOutputUrl), "utf-8");
      });

      it("should have the expected getting started prompt", function () {
        expect(pageContents).to.contain(
          "<h2>Edit <code>src/pages/index.html</code> to start making changes</h2>",
        );
      });

      it("should have the card headings for src/pages/index.html", function () {
        expect(pageContents).to.contain("<h3>Getting Started</h3>");
        expect(pageContents).to.contain("<h3>Docs</h3>");
        expect(pageContents).to.contain("<h3>Guides</h3>");
        expect(pageContents).to.contain("<h3>Community</h3>");
      });

      it("should have a <script> tag to the logo component", function () {
        expect(pageContents).to.contain(
          '<script type="module" src="../components/logo/logo.js"></script>',
        );
        expect(pageContents).to.contain("<x-logo></x-logo>");
      });
    });
  });

  after(async function () {
    await runner.teardown([initOutputUrl]);
  });
});
