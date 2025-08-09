/*
 * Use Case
 * Scaffold from minimal template and using the TypeScript flag.
 *
 * User Result
 * Should scaffold from template build.
 *
 * User Command
 * npx @greenwood/init --name=my-app --ts yes
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

  describe("Scaffolding a new project with TypeScript option", function () {
    before(function () {
      runner.setup(outputPath);
      runner.runCommand(initPath, ["--name", APP_NAME, "--ts", "--install", "no"]);
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

      it("should generate a tsconfig.json file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "tsconfig.json"))).to.be.true;
      });

      it("should generate a greenwood.config.ts file", function () {
        expect(fs.existsSync(path.join(initOutputPath, "greenwood.config.ts"))).to.be.true;
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

      it("the should have the correct script for type-checking", function () {
        const scripts = pkgJson.scripts;

        expect(scripts.check).to.equal("tsc");
      });

      it("the should have the correct Greenwood devDependency", function () {
        const initPkg = JSON.parse(
          fs.readFileSync(new URL("../../../package.json", import.meta.url), "utf-8"),
        );

        expect(pkgJson.devDependencies["@greenwood/cli"]).to.equal(`~${initPkg.version}`);
      });

      it("the should have TypeScript as a dependency", function () {
        const templatePkg = JSON.parse(
          fs.readFileSync(
            new URL("../../../src/template-base-ts/package.json", import.meta.url),
            "utf-8",
          ),
        );

        expect(pkgJson.devDependencies["typescript"].version).to.equal(
          templatePkg.devDependencies["typescript"].version,
        );
      });
    });

    describe("initial tsconfig.json contents", function () {
      const target = "es2020";
      let tsConfigJson;

      before(function () {
        tsConfigJson = JSON.parse(
          fs.readFileSync(path.join(initOutputPath, "tsconfig.json"), "utf-8"),
        );
      });

      it("should have the expected minimum required compiler options set", function () {
        const { compilerOptions } = tsConfigJson;
        const { target, module, moduleResolution, allowImportingTsExtensions, noEmit } =
          compilerOptions;

        expect(target).to.equal(target);
        expect(module).to.equal("preserve");
        expect(moduleResolution).to.equal("bundler");
        expect(allowImportingTsExtensions).to.equal(true);
        expect(noEmit).to.equal(true);
      });

      it("should have the expected recommended compiler options", function () {
        const { compilerOptions } = tsConfigJson;
        const { erasableSyntaxOnly, verbatimModuleSyntax, lib } = compilerOptions;

        expect(erasableSyntaxOnly).to.equal(true);
        expect(verbatimModuleSyntax).to.equal(false);

        expect(lib).to.contain(target.toUpperCase()); // should match compilerOptions.target
        expect(lib).to.contain("DOM");
        expect(lib).to.contain("DOM.Iterable");
      });

      it("should have the expected exclude configuration for Greenwood build output", function () {
        const { exclude } = tsConfigJson;

        expect(exclude).to.contain("./public/");
        expect(exclude).to.contain("./greenwood/");
        expect(exclude).to.contain("node_modules");
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
          '<script type="module" src="../components/logo/logo.ts"></script>',
        );
        expect(pageContents).to.contain("<x-logo></x-logo>");
      });
    });
  });

  after(function () {
    runner.teardown([initOutputPath]);
  });
});
