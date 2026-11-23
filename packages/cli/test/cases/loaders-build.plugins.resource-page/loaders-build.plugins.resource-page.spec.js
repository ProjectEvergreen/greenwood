/*
 * Use Case
 * Run Greenwood with a custom resource plugin and default workspace with a custom page formats.
 *
 * User Result
 * Should generate a bare bones Greenwood build with expected custom page format behaviors.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * class FooResource {
 *   // see complete implementation in the greenwood.config.js file used for this spec
 * }
 *
 * class BarResource {
 *   // see complete implementation in the greenwood.config.js file used for this spec
 * }
 *
 * {
 *   plugins: [{
 *     type: 'resource',
 *     name: 'plugin-foo',
 *     provider: (compilation, options) => new FooResource(compilation, options)
 *   },{
 *     type: 'resource',
 *     name: 'plugin-bar',
 *     provider: (compilation, options) => new BarResource(compilation, options)
 *   }]
 * }
 *
 * Custom Workspace
 * src/
 *   pages/
 *     api
 *       greeting.bar
 *     about.foo
 *     contact.bar
 *     index.html
 */
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import fs from "node:fs";
import glob from "glob-promise";
import { getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Build Greenwood With: ", function () {
  const LABEL = "Custom Static and Dynamic Page Loaders";
  const cliUrl = new URL("../../../src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner({ forwardParentArgs: true });
  });

  describe(LABEL, function () {
    before(async function () {
      await runner.setup(outputUrl);
      await runner.runCommand(cliUrl, { args: "build" });
    });

    describe("Home Page", function () {
      let homePage;

      before(async function () {
        homePage = await glob.promise(fileURLToPath(new URL("index.html", this.context.publicDir)));
      });

      it("should have expected text from from my-other-custom-file.foo in the script output file", function () {
        const contents = fs.readFileSync(homePage[0], "utf-8");

        expect(contents).to.contain("My Foo Website");
      });
    });

    describe("Custom Format Static About Page", function () {
      let aboutPage;

      before(async function () {
        aboutPage = await glob.promise(
          fileURLToPath(new URL("*about/index.html", this.context.publicDir)),
        );
      });

      it("should have the expected JavaScript equivalent file in the output directory", function () {
        expect(aboutPage).to.have.lengthOf(1);
      });

      it("should have expected text from from my-other-custom-file.foo in the script output file", function () {
        const contents = fs.readFileSync(aboutPage[0], "utf-8");

        expect(contents).to.contain("Welcome to our About page!");
      });
    });

    describe("Custom Format Dynamic Contact Page (exported with prerendering)", function () {
      let contactPage;

      before(async function () {
        contactPage = await glob.promise(
          fileURLToPath(new URL("contact/index.html", this.context.publicDir)),
        );
      });

      it("should have the expected pre-rendered HTML file in the output directory", function () {
        expect(contactPage).to.have.lengthOf(1);
      });

      it("should have expected text from the output HTML file", function () {
        const contents = fs.readFileSync(contactPage[0], "utf-8");

        expect(contents).to.contain("Welcome to our Contact page!");
      });
    });

    describe("Custom Format Dynamic API Route", function () {
      let handler;

      before(async function () {
        handler = (await import(new URL("./public/api/greeting.js", import.meta.url))).handler;
      });

      it("should have the expected output from the API route", async function () {
        const response = await handler(new Request(new URL("http://localhost:8080/api/greeting")));
        const data = await response.json();

        expect(data.message).to.equal("Hello World!!!");
      });
    });
  });

  after(async function () {
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
