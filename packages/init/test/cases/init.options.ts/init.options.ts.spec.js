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
import { expect } from "chai";
import fs from "node:fs";
import { Runner } from "gallinago";

describe("Initialize a new Greenwood project: ", function () {
  const APP_NAME = "my-app";
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

  describe("Scaffolding a new project with TypeScript option", function () {
    before(async function () {
      await runner.setup(outputUrl, { create: false });
      await runner.runCommand(initUrl, { args: ["--name", APP_NAME, "--ts", "--install", "no"] });
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

      it("should generate a tsconfig.json file", function () {
        expect(fs.existsSync(new URL("tsconfig.json", initOutputUrl))).to.be.true;
      });

      it("should generate a greenwood.config.ts file", function () {
        expect(fs.existsSync(new URL("greenwood.config.ts", initOutputUrl))).to.be.true;
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
          fs.readFileSync(new URL("tsconfig.json", initOutputUrl), "utf-8"),
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
        expect(verbatimModuleSyntax).to.equal(true);

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
          '<script type="module" src="../components/logo/logo.ts"></script>',
        );
        expect(pageContents).to.contain("<x-logo></x-logo>");
      });
    });

    describe("Default Types", function () {
      it("should generate a types.d.ts file", function () {
        expect(fs.existsSync(new URL("src/types.d.ts", initOutputUrl))).to.be.true;
      });
    });
  });

  after(async function () {
    await runner.teardown([initOutputUrl]);
  });
});
