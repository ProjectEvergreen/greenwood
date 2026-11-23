/*
 * Use Case
 * Run Greenwood for development with lit renderer plugin.
 *
 * User Result
 * Should serve a bare bones Greenwood build for developing with Lit+SSR.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * import { greenwoodPluginRendererLit } from '@greenwood/plugin-renderer-lit';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginRendererLit()
 *   }]
 * }
 *
 * User Workspace
 *  src/
 *   pages/
 *     index.js
 *     search.html
 */
import { expect } from "chai";
import { JSDOM } from "jsdom";
import { getDependencyFiles, getOutputTeardownFiles } from "../../../../../test/utils.js";
import { Runner } from "gallinago";

describe("Develop Greenwood With: ", function () {
  const LABEL = "Lit Renderer";
  const cliUrl = new URL("../../../../cli/src/bin.js", import.meta.url);
  const outputUrl = new URL("./", import.meta.url);
  const hostname = "http://127.0.0.1:1984";
  let runner;

  before(function () {
    this.context = {
      publicDir: new URL("public/", outputUrl),
    };
    runner = new Runner();
  });

  describe(LABEL, function () {
    before(async function () {
      const lit = await getDependencyFiles(
        new URL("../../../../../node_modules/lit/*.js", import.meta.url),
        new URL("node_modules/lit/", outputUrl),
      );
      const litDecorators = await getDependencyFiles(
        new URL("../../../../../node_modules/lit/decorators/*.js", import.meta.url),
        new URL("node_modules/lit/decorators/", outputUrl),
      );
      const litDirectives = await getDependencyFiles(
        new URL("../../../../../node_modules/lit/directives/*.js", import.meta.url),
        new URL("node_modules/lit/directives/", outputUrl),
      );
      const litPackageJson = await getDependencyFiles(
        new URL("../../../../../node_modules/lit/package.json", import.meta.url),
        new URL("node_modules/lit/", outputUrl),
      );
      const litElement = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-element/*.js", import.meta.url),
        new URL("node_modules/lit-element/", outputUrl),
      );
      const litElementPackageJson = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-element/package.json", import.meta.url),
        new URL("node_modules/lit-element/", outputUrl),
      );
      const litElementDecorators = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-element/decorators/*.js", import.meta.url),
        new URL("node_modules/lit-element/decorators/", outputUrl),
      );
      const litHtml = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-html/*.js", import.meta.url),
        new URL("node_modules/lit-html/", outputUrl),
      );
      const litHtmlNode = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-html/node/*.js", import.meta.url),
        new URL("node_modules/lit-html/node/", outputUrl),
      );
      const litHtmlNodeDirectives = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-html/node/directives/*.js", import.meta.url),
        new URL("node_modules/lit-html/node/directives/", outputUrl),
      );
      const litHtmlPackageJson = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-html/package.json", import.meta.url),
        new URL("node_modules/lit-html/", outputUrl),
      );
      const litHtmlDirectives = await getDependencyFiles(
        new URL("../../../../../node_modules/lit-html/directives/*.js", import.meta.url),
        new URL("node_modules/lit-html/directives/", outputUrl),
      );
      // lit-html has a dependency on this
      // https://github.com/lit/lit/blob/main/packages/lit-html/package.json#L82
      const trustedTypes = await getDependencyFiles(
        new URL("../../../../../node_modules/@types/trusted-types/package.json", import.meta.url),
        new URL("node_modules/@types/trusted-types/", outputUrl),
      );
      const litReactiveElement = await getDependencyFiles(
        new URL("../../../../../node_modules/@lit/reactive-element/*.js", import.meta.url),
        new URL("node_modules/@lit/reactive-element/", outputUrl),
      );
      const litReactiveElementNode = await getDependencyFiles(
        new URL("../../../../../node_modules/@lit/reactive-element/node/*.js", import.meta.url),
        new URL("node_modules/@lit/reactive-element/node/", outputUrl),
      );
      const litReactiveElementDecorators = await getDependencyFiles(
        new URL(
          "../../../../../node_modules/@lit/reactive-element/decorators/*.js",
          import.meta.url,
        ),
        new URL("node_modules/@lit/reactive-element/decorators/", outputUrl),
      );
      const litReactiveElementPackageJson = await getDependencyFiles(
        new URL("../../../../../node_modules/@lit/reactive-element/package.json", import.meta.url),
        new URL("node_modules/@lit/reactive-element/", outputUrl),
      );
      const litSsrElementHydrationSupport = await getDependencyFiles(
        new URL(
          "../../../../../node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js",
          import.meta.url,
        ),
        new URL("node_modules/@lit-labs/ssr-client/", outputUrl),
      );
      const litSsrHtmlHydrationSupport = await getDependencyFiles(
        new URL("../../../../../node_modules/@lit-labs/ssr-client/lib/*.js", import.meta.url),
        new URL("node_modules/@lit-labs/ssr-client/lib/", outputUrl),
      );
      const litSsrDomShimPackageJson = await getDependencyFiles(
        new URL("../../../../../node_modules/@lit-labs/ssr-dom-shim/package.json", import.meta.url),
        new URL("node_modules/@lit-labs/ssr-dom-shim/", outputUrl),
      );
      const litSsrDomShim = await getDependencyFiles(
        new URL("../../../../../node_modules/@lit-labs/ssr-dom-shim/*.js", import.meta.url),
        new URL("node_modules/@lit-labs/ssr-dom-shim/", outputUrl),
      );
      const litSsrDomShimLibs = await getDependencyFiles(
        new URL("../../../../../node_modules/@lit-labs/ssr-dom-shim/lib/*.js", import.meta.url),
        new URL("node_modules/@lit-labs/ssr-dom-shim/lib/", outputUrl),
      );

      // would be nice to figure out why this test case still requires manually copying in dependencies
      await runner.setup(outputUrl, {
        setupFiles: [
          ...lit,
          ...litPackageJson,
          ...litDirectives,
          ...litDecorators,
          ...litElementPackageJson,
          ...litElement,
          ...litElementDecorators,
          ...litHtmlPackageJson,
          ...litHtml,
          ...litHtmlNode,
          ...litHtmlDirectives,
          ...litHtmlNodeDirectives,
          ...trustedTypes,
          ...litReactiveElement,
          ...litReactiveElementNode,
          ...litReactiveElementDecorators,
          ...litReactiveElementPackageJson,
          ...litSsrElementHydrationSupport,
          ...litSsrHtmlHydrationSupport,
          ...litSsrDomShim,
          ...litSsrDomShimPackageJson,
          ...litSsrDomShimLibs,
        ],
      });

      await new Promise((resolve, reject) => {
        runner
          .runCommand(cliUrl, {
            args: "develop",
            onStdOut: (message) => {
              if (message.includes("Started local development server at http://localhost:1984")) {
                resolve();
              }
            },
          })
          .catch(reject);
      });
    });

    describe("Develop command with expected HTML for the / route", function () {
      let response = {};
      let dom;
      let body;

      before(async function () {
        response = await fetch(`${hostname}/`);
        body = await response.text();
        dom = new JSDOM(body);
      });

      it("should return a 200 status", function (done) {
        expect(response.status).to.equal(200);
        done();
      });

      it("should return the correct content type", function (done) {
        expect(response.headers.get("content-type")).to.equal("text/html");
        done();
      });

      it("should return a response body", function (done) {
        expect(body).to.not.be.undefined;
        done();
      });

      it("the response body should be valid HTML from JSDOM", function (done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it("should have the expected lit hydration script in the <head>", function () {
        const scripts = Array.from(
          dom.window.document.querySelectorAll('script[src*="lit-element-hydrate-support"]'),
        );

        expect(scripts.length).to.equal(1);
      });

      it("should have the expected lit hydration script _after_ any importmaps in the <head>", function () {
        // make sure this does NOT come before an importmap
        const scripts = Array.from(
          dom.window.document.querySelectorAll(
            'script[src*="lit-element-hydrate-support"] + script[type="importmap"]',
          ),
        );

        expect(scripts.length).to.equal(0);
      });
    });

    describe("Develop command with expected HTML for the static /search/ route", function () {
      let resp;
      let dom;

      before(async function () {
        resp = await fetch(`${hostname}/search/`);
        dom = new JSDOM(await resp.text());
      });

      it("should include hydration support after the import map on a static HTML page", function () {
        const scripts = Array.from(dom.window.document.querySelectorAll("head script"));
        const hydrationScripts = scripts.filter((script) =>
          script.src.includes("lit-element-hydrate-support"),
        );
        const importMapIndex = scripts.findIndex((script) => script.type === "importmap");

        expect(resp.status).to.equal(200);
        expect(hydrationScripts.length).to.equal(1);
        expect(importMapIndex).to.be.at.least(0);
        expect(scripts.indexOf(hydrationScripts[0])).to.be.greaterThan(importMapIndex);
      });
    });
  });

  after(async function () {
    await runner.stopCommand();
    await runner.teardown(getOutputTeardownFiles(outputUrl));
  });
});
