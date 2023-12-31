/*
 * Use Case
 * Run Greenwood build command when using the puppeteer renderer plugin for prerendering.
 *
 * User Result
 * Should generate a Greenwood build with puppeteer generated output for Web Components.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [
 *     ...greenwoodPluginRendererPuppeteer()
 *   ]
 * }
 *
 * User Workspace
 *  src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
import chai from 'chai';
import fs from 'fs/promises';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getDependencyFiles, getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Puppeteer prerendering enabled';
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
      const reduxLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux/es/redux.mjs`,
        `${outputPath}/node_modules/redux/es`
      );
      const reduxPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux/package.json`,
        `${outputPath}/node_modules/redux/`
      );
      const looseLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/loose-envify/index.js`,
        `${outputPath}/node_modules/loose-envify`
      );
      const looseLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/loose-envify/package.json`,
        `${outputPath}/node_modules/loose-envify/`
      );
      const tokensLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/js-tokens/index.js`,
        `${outputPath}/node_modules/js-tokens`
      );
      const tokensLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/js-tokens/package.json`,
        `${outputPath}/node_modules/js-tokens/`
      );
      const symbolLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/symbol-observable/es/*.js`,
        `${outputPath}/node_modules/symbol-observable/es`
      );
      const symbolLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/symbol-observable/package.json`,
        `${outputPath}/node_modules/symbol-observable/`
      );
      const lodashEsLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lodash-es/*.js`,
        `${outputPath}/node_modules/lodash-es/`
      );
      const lodashEsLibsPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lodash-es/package.json`,
        `${outputPath}/node_modules/lodash-es/`
      );
      const pwaHelpersLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/pwa-helpers/*.js`,
        `${outputPath}/node_modules/pwa-helpers/`
      );
      const pwaHelpersPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/pwa-helpers/package.json`,
        `${outputPath}/node_modules/pwa-helpers/`
      );
      const simpleCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/simple.css`,
        `${outputPath}/node_modules/simpledotcss/`
      );
      const simpleCssPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/simpledotcss/package.json`,
        `${outputPath}/node_modules/simpledotcss/`
      );
      const prismCss = await getDependencyFiles(
        `${process.cwd()}/node_modules/prismjs/themes/prism-tomorrow.css`,
        `${outputPath}/node_modules/prismjs/themes/`
      );
      const prismPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/prismjs/package.json`,
        `${outputPath}/node_modules/prismjs/`
      );

      runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...reduxLibs,
        ...reduxPackageJson,
        ...looseLibs,
        ...looseLibsPackageJson,
        ...tokensLibs,
        ...tokensLibsPackageJson,
        ...symbolLibs,
        ...symbolLibsPackageJson,
        ...lit,
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
        ...litReactiveElementPackageJson,
        ...lodashEsLibs,
        ...lodashEsLibsPackageJson,
        ...pwaHelpersPackageJson,
        ...pwaHelpersLibs,
        ...prismCss,
        ...prismPackageJson,
        ...simpleCss,
        ...simpleCssPackageJson
      ]);
      runner.setup(outputPath, getSetupFiles(outputPath));
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Default output for index.html', function() {
      let dom;
      let raw;

      before(async function() {
        const outputFile = path.join(this.context.publicDir, './index.html');

        raw = await fs.readFile(outputFile, 'utf-8');
        dom = await JSDOM.fromFile(outputFile);
      });

      describe('head section tags', function() {
        it('should have a <title> tag in the <head>', function() {
          const title = dom.window.document.querySelector('head title').textContent;

          expect(title).to.be.equal('My App');
        });

        it('should have one <style> tag in the <head> from puppeteer', function() {
          const styleTag = dom.window.document.querySelectorAll('head style');

          expect(raw).to.contain('<!-- Shady DOM styles for app-header -->');
          expect(styleTag.length).to.be.equal(1);
          expect(styleTag[0].textContent).to.contain('body[unresolved]');
        });
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const heading = dom.window.document.querySelector('body h1').textContent;

        expect(heading).to.equal('Welcome to Greenwood!');
      });

      it('should contain the expected number of javascript files in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '*.js'))).to.have.lengthOf(3);
      });

      it('should have the expected output from main.js for lit (ESM) in the page output', async function() {
        const litOutput = dom.window.document.querySelectorAll('body > .output-lit');

        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal('import from lit W29iamVjdCBIVE1M');
      });

      it('should have the expected output from main.js for lodash-es (ESM) in the page output', async function() {
        const litOutput = dom.window.document.querySelectorAll('body > .output-lodash');

        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal('import from lodash-es {"a":1,"b":2}');
      });

      it('should have the expected output from main.js for pwa-helpers (ESM) in the page output', async function() {
        const litOutput = dom.window.document.querySelectorAll('body > .output-pwa');

        expect(litOutput.length).to.be.equal(1);
        expect(litOutput[0].textContent).to.be.equal('import from pwa-helpers KGNvbWJpbmVSZWR1');
      });

      it('should have the expected output from main.js for Redux (MJS) in the page output', async function() {
        const reduxOutput = dom.window.document.querySelectorAll('body > .output-redux');

        expect(reduxOutput.length).to.be.equal(1);
        expect(reduxOutput[0].textContent).to.be.equal('import from redux ZnVuY3Rpb24gbyh0');
      });

      it('should have the expected output from the first inline <script> tag in the page output', async function() {
        const inlineScriptOutput = dom.window.document.querySelectorAll('body > .output-script-inline');

        expect(inlineScriptOutput.length).to.be.equal(1);
        expect(inlineScriptOutput[0].textContent).to.be.equal('script tag module inline');
      });

      it('should have the expected output from main.js for try / catch error of no error text', async function() {
        const errorOutput = dom.window.document.querySelectorAll('body > .output-error');

        expect(errorOutput.length).to.be.equal(1);
        expect(errorOutput[0].textContent).to.be.equal('');
      });

      it('should have the expected inline node_modules content in the first inline script tag which should include extra code from rollup', async function() {
        const inlineScriptTag = Array.from(dom.window.document.querySelectorAll('head > script:not([src])')).filter(tag => !tag.getAttribute('data-gwd'))[0];

        expect(inlineScriptTag.textContent.replace('\n', '')).to
          // eslint-disable-next-line max-len
          .contain('import"/lit-element.6ff69bae.js";document.getElementsByClassName("output-script-inline")[0].innerHTML="script tag module inline";//# sourceMappingURL=');
      });

      it('should have prerendered content from <app-header> component', function() {
        const appHeader = dom.window.document.querySelectorAll('body app-header');
        const header = dom.window.document.querySelectorAll('body header');

        expect(appHeader.length).to.equal(1);
        expect(header.length).to.equal(1);
        expect(header[0].textContent.trim()).to.equal('This is the header component.');
      });
    });
  });

  after(async function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});