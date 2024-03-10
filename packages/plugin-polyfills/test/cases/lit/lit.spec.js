/*
 * Use Case
 * Run Greenwood with Polyfills composite plugin with default options and using Lit.
 *
 * User Result
 * Should generate a bare bones Greenwood build with polyfills injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginPolyfills } from '@greenwood/plugin-polyfills';
 *
 * {
 *   plugins: [
 *     ...greenwoodPluginPolyfills({
 *       lit: true
 *     })
 *   ]
 * }
 *
 * User Workspace
 * Greenwood default
 */
import chai from 'chai';
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;
const expectedLitPolyfillFiles = [
  'polyfill-support.js'
];

describe('Build Greenwood With: ', function() {
  const LABEL = 'Lit Polyfill Plugin with default options and Default Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
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
      const litReactiveElementDecorators = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/decorators/*.js`,
        `${outputPath}/node_modules/@lit/reactive-element/decorators/`
      );
      const litReactiveElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/@lit/reactive-element/package.json`,
        `${outputPath}/node_modules/@lit/reactive-element/`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...lit, // includes polyfill-support.js
        ...litPackageJson,
        ...litDirectives,
        ...litDecorators,
        ...litElementPackageJson,
        ...litElement,
        ...litElementDecorators,
        ...litHtmlPackageJson,
        ...litHtml,
        ...litHtmlDirectives,
        ...trustedTypes,
        ...litReactiveElement,
        ...litReactiveElementDecorators,
        ...litReactiveElementPackageJson
      ]);
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Script tag in the <head> tag', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have one <script> tag for lit polyfills loaded in the <head> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const polyfillScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.src.indexOf('polyfill-support') >= 0;
        });

        expect(polyfillScriptTags.length).to.be.equal(1);
      });

      it('should have the expected lit polyfill files in the output directory', function() {
        expectedLitPolyfillFiles.forEach((file) => {
          expect(fs.existsSync(path.join(this.context.publicDir, file))).to.be.equal(true);
        });
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});