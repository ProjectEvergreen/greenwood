/*
 * Use Case
 * Scaffold from minimal template accepting all default options.
 *
 * User Result
 * Should scaffold from template build.
 *
 * User Command
 * npx @greenwood/init --yes
 *
 * User Workspace
 * N / A
 */
import chai from "chai";
import fs from "node:fs";
import path from "node:path";
import { Runner } from "gallinago";
import { fileURLToPath } from "node:url";

const expect = chai.expect;

describe("Initialize a new Greenwood project: ", function () {
  const APP_NAME = "my-app";
  const initPath = path.join(process.cwd(), "packages/init/src/index.js");
  const outputPath = path.dirname(fileURLToPath(new URL(import.meta.url)));
  const initOutputPath = path.join(outputPath, `/${APP_NAME}`);
  let runner;

  before(function () {
    this.context = {
      publicDir: outputPath,
    };
    runner = new Runner();
  });

  describe("Scaffolding a new project accepting all default options", function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(initPath, ["-y"]);
    });

    describe("project files and folders", () => {
      it("should create a src/pages directory", function () {
        expect(fs.existsSync(path.join(initOutputPath, "src", "pages"))).to.be.true;
      });

      it("should generate a .gitignore file", function () {
        expect(fs.existsSync(path.join(initOutputPath, ".gitignore"))).to.be.true;
      });

      it("should generate a package.json file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "package.json"))).to.be.true;
      });

      it("should not generate a .npmrc file", function () {
        const npmrcPath = path.join(initOutputPath, ".npmrc");

        expect(fs.existsSync(npmrcPath)).to.be.false;
      });

      it("should not generate a package-lock.json file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "package-lock.json"))).to.be.false;
      });

      it("should not generate a yarn.lock file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "yarn.lock"))).to.be.false;
      });

      it("should not generate a pnpm-lock.yaml file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "pnpm-lock.yaml"))).to.be.false;
      });

      it("should not generate a public directory", function () {
        expect(fs.existsSync(path.join(initOutputPath, "public"))).to.be.false;
      });
    });

    describe("initial package.json contents", function () {
      let pkgJson;

      before(function () {
        pkgJson = JSON.parse(fs.readFileSync(path.join(initOutputPath, "package.json"), "utf-8"));
      });

      it("the should have the correct name", function () {
        expect(pkgJson.name).to.equal(APP_NAME);
      });

      it("the should have the correct type", function () {
        expect(pkgJson.type).to.equal("module");
      });

      it("the should have the correct version", function () {
        expect(pkgJson.version).to.equal("0.1.0");
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
        pageContents = fs.readFileSync(path.join(initOutputPath, "src/pages/index.html"), "utf-8");
      });

      it("should have the expected getting started prompt", function () {
        expect(pageContents).to.contain(
          "<h1>Edit <code>src/pages/index.html</code> to start making changes</h1>",
        );
      });

      it("should have the card headings for src/pages/index.html", function () {
        expect(pageContents).to.contain("<h2>Getting Started</h2>");
        expect(pageContents).to.contain("<h2>Docs</h2>");
        expect(pageContents).to.contain("<h2>Guides</h2>");
        expect(pageContents).to.contain("<h2>Community</h2>");
      });

      it("should have a <script> tag to the logo component", function () {
        expect(pageContents).to.contain(
          '<script type="module" src="../components/logo/logo.js"></script>',
        );
        expect(pageContents).to.contain("<x-logo></x-logo>");
      });
    });
  });

  after(function () {
    runner.teardown([initOutputPath]);
  });
});
