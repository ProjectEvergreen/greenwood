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
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Lit Renderer';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://127.0.0.1:1984';
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      const lit = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/*.js`,
        `${outputPath}/node_modules/lit/`
      );
      const litDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/decorators/*.js`,
        `${outputPath}/node_modules/lit/decorators/`
      );
      const litDirectives = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/directives/*.js`,
        `${outputPath}/node_modules/lit/directives/`
      );
      const litPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit/package.json`,
        `${outputPath}/node_modules/lit/`
      );
      const litElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/*.js`,
        `${outputPath}/node_modules/lit-element/`
      );
      const litElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/package.json`,
        `${outputPath}/node_modules/lit-element/`
      );
      const litElementDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/decorators/*.js`,
        `${outputPath}/node_modules/lit-element/decorators/`
      );
      const litHtml = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/*.js`,
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlNode = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/node/*.js`,
        `${outputPath}/node_modules/lit-html/node/`
      );
      const litHtmlNodeDirectives = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/node/directives/*.js`,
        `${outputPath}/node_modules/lit-html/node/directives/`
      );
      const litHtmlPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/package.json`,
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlDirectives = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/directives/*.js`,
        `${outputPath}/node_modules/lit-html/directives/`
      );
      // lit-html has a dependency on this
      // https://github.com/lit/lit/blob/main/packages/lit-html/package.json#L82
      const trustedTypes = await getDependencyFiles(
        `${process.cwd()}/node_modules/@types/trusted-types/package.json`,
        `${outputPath}/node_modules/@types/trusted-types/`
      );
      const litReactiveElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/*.js`,
        `${outputPath}/node_modules/@lit/reactive-element/`
      );
      const litReactiveElementNode = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/node/*.js`,
        `${outputPath}/node_modules/@lit/reactive-element/node/`
      );
      const litReactiveElementDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/decorators/*.js`,
        `${outputPath}/node_modules/@lit/reactive-element/decorators/`
      );
      const litReactiveElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/package.json`,
        `${outputPath}/node_modules/@lit/reactive-element/`
      );
      const litSsrElementHydrationSupport = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit-labs/ssr-client/lit-element-hydrate-support.js`,
        `${outputPath}/node_modules/@lit-labs/ssr-client/`
      );
      const litSsrHtmlHydrationSupport = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit-labs/ssr-client/lib/*.js`,
        `${outputPath}/node_modules/@lit-labs/ssr-client/lib/`
      );
      const litSsrDomShimPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit-labs/ssr-dom-shim/package.json`,
        `${outputPath}/node_modules/@lit-labs/ssr-dom-shim/`
      );
      const litSsrDomShim = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit-labs/ssr-dom-shim/*.js`,
        `${outputPath}/node_modules/@lit-labs/ssr-dom-shim/`
      );
      const litSsrDomShimLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit-labs/ssr-dom-shim/lib/*.js`,
        `${outputPath}/node_modules/@lit-labs/ssr-dom-shim/lib/`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
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
        ...litSsrDomShimLibs
      ]);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 10000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    describe('Develop command with expected HTML for the / route', function() {
      let response = {};
      let dom;
      let body;

      before(async function() {
        response = await fetch(`${hostname}/`);
        body = await response.text();
        dom = new JSDOM(body);
      });

      it('should return a 200 status', function(done) {
        expect(response.status).to.equal(200);
        done();
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.equal('text/html');
        done();
      });

      it('should return a response body', function(done) {
        expect(body).to.not.be.undefined;
        done();
      });

      it('the response body should be valid HTML from JSDOM', function(done) {
        expect(dom).to.not.be.undefined;
        done();
      });

      it('should have the expected lit hydration script in the <head>', function() {
        const scripts = Array.from(dom.window.document.querySelectorAll('script[src*="lit-element-hydrate-support"]'));

        expect(scripts.length).to.equal(1);
      });

      it('should have the expected lit hydration script _after_ any importmaps in the <head>', function() {
        // make sure this does NOT come before an importmap
        const scripts = Array.from(dom.window.document.querySelectorAll('script[src*="lit-element-hydrate-support"] + script[type="importmap"'));

        expect(scripts.length).to.equal(0);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
    runner.stopCommand();
  });
});