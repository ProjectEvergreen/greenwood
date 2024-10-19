/*
 * Use Case
 * Run Greenwood develop command with import maps polyfill flag enabled.
 *
 * User Result
 * Should start the development server and have all the expected import map shim behaviors.
 *
 * User Command
 * greenwood develop
 *
 * User Config
 * devServer: {
 *   polyfill: {
 *     importMaps: true
 *   }
 * }
 *
 * User Workspace
 * src/
 *   components/
 *     hero.js
 *   index.html
 * greenwood.config.js
 * package.json
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Develop Greenwood With: ', function() {
  const LABEL = 'Import Maps Polyfill Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
  const hostname = 'http://localhost';
  const port = 1984;
  let runner;

  before(function() {
    this.context = {
      hostname: `${hostname}:${port}`
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
      const litSsrPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit-labs/ssr-dom-shim/package.json`,
        `${outputPath}/node_modules/@lit-labs/ssr-dom-shim/`
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
      const litHtmlPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/package.json`,
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlDirectives = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/directives/*.js`,
        `${outputPath}/node_modules/lit-html/directives/`
      );
      const litReactiveElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/*.js`,
        `${outputPath}/node_modules/@lit/reactive-element/`
      );
      const litReactiveElementDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/decorators/*.js`,
        `${outputPath}/node_modules/@lit/reactive-element/decorators/`
      );
      const litReactiveElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/package.json`,
        `${outputPath}/node_modules/@lit/reactive-element/`
      );
      const litHtmlSourceMap = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lit-html.js.map`,
        `${outputPath}/node_modules/lit-html/`
      );
      const trustedTypesPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@types/trusted-types/package.json`,
        `${outputPath}/node_modules/@types/trusted-types/`
      );
      const tslibPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/tslib/package.json`,
        `${outputPath}/node_modules/tslib/`
      );
      const tslibLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/tslib/*.js`,
        `${outputPath}/node_modules/tslib/`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...lit,
        ...litPackageJson,
        ...litSsrPackageJson,
        ...litDirectives,
        ...litDecorators,
        ...litElementPackageJson,
        ...litElement,
        ...litElementDecorators,
        ...litHtmlPackageJson,
        ...litHtml,
        ...litHtmlDirectives,
        ...litReactiveElement,
        ...litReactiveElementDecorators,
        ...litReactiveElementPackageJson,
        ...litHtmlSourceMap,
        ...tslibPackageJson,
        ...tslibLibs,
        ...trustedTypesPackageJson
      ]);

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 5000);

        runner.runCommand(cliPath, 'develop', { async: true });
      });
    });

    describe('Import Map Shim Behaviors', function() {
      let response = {};
      let dom;

      before(async function() {
        response = await fetch(`${hostname}:${port}/`, {
          headers: {
            accept: 'text/html'
          }
        });

        dom = new JSDOM(await response.clone().text());
      });

      it('should return the correct content type', function(done) {
        expect(response.headers.get('content-type')).to.contain('text/html');
        done();
      });

      it('should return a 200', function(done) {
        expect(response.status).to.equal(200);

        done();
      });

      // <script type="importmap-shim">{ "imports": {} }</script>
      it('should have a shim-ed importmaps <script> tag in the <head> tag', function(done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script[type="importmap-shim"'));

        expect(scriptTags.length).to.equal(1);
        done();
      });

      // <script defer src="/node_modules/es-module-shims/dist/es-module-shims.js"></script>
      it('should have a <script> tag for loading the shim library', function(done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script[src*="node_modules/es-module-shims"'));

        expect(scriptTags.length).to.equal(1);
        done();
      });

      // <script type="module-shim" src="./components/hero.js"></script>
      it('should have a shim-ed <script> tag for the <app-hero> tag', function(done) {
        const scriptTags = Array.from(dom.window.document.querySelectorAll('head > script[src*="hero.js"'));

        expect(scriptTags.length).to.equal(1);
        expect(scriptTags[0].getAttribute('type')).to.equal('module-shim');
        done();
      });
    });
  });

  after(function() {
    runner.stopCommand();
    runner.teardown([
      path.join(outputPath, '.greenwood'),
      path.join(outputPath, 'node_modules')
    ]);
  });
});