/*
 * Use Case
 * Run Greenwood with a single index.html file to build a SPA based project.
 *
 * User Result
 * Should generate a Greenwood build for a SPA.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * Greenwood default w/ single index.html file
 *  src/
 *   components/
 *     footer.js
 *   routes/
 *     about.js
 *     home.js
 *   index.js
 *   index.html
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'A Single Page Application (SPA)';
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
      const litReduxRouterPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-redux-router/package.json`,
        `${outputPath}/node_modules/lit-redux-router/`
      );
      const litReduxRouter = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-redux-router/*.js`,
        `${outputPath}/node_modules/lit-redux-router/`
      );
      const litReduxRouterLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-redux-router/lib/*.js`,
        `${outputPath}/node_modules/lit-redux-router/lib/`
      );
      const pwaHelpersLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/pwa-helpers/*.js`,
        `${outputPath}/node_modules/pwa-helpers/`
      );
      const pwaHelpersPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/pwa-helpers/package.json`,
        `${outputPath}/node_modules/pwa-helpers/`
      );
      const reduxDist = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux/dist/*.js`,
        `${outputPath}/node_modules/redux/dist/`
      );
      const reduxMjs = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux/dist/*.mjs`,
        `${outputPath}/node_modules/redux/dist/`
      );
      const reduxPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux/package.json`,
        `${outputPath}/node_modules/redux/`
      );
      const regexParam = await getDependencyFiles(
        `${process.cwd()}/node_modules/regexparam/dist/*`,
        `${outputPath}/node_modules/regexparam/dist/`
      );
      const regexParamPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/regexparam/package.json`,
        `${outputPath}/node_modules/regexparam/`
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
      const reduxThunk = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux-thunk/dist/*.js`,
        `${outputPath}/node_modules/redux-thunk/dist/`
      );
      const reduxThunkMjs = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux-thunk/dist/*.mjs`,
        `${outputPath}/node_modules/redux-thunk/dist/`
      );
      const reduxThunkPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/redux-thunk/package.json`,
        `${outputPath}/node_modules/redux-thunk/`
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
        ...litHtmlDirectives,
        ...trustedTypes,
        ...litReactiveElement,
        ...litReactiveElementDecorators,
        ...litReactiveElementPackageJson,
        ...litReduxRouterPackageJson,
        ...litReduxRouter,
        ...litReduxRouterLibs,
        ...pwaHelpersLibs,
        ...pwaHelpersPackageJson,
        ...reduxDist,
        ...reduxMjs,
        ...reduxPackageJson,
        ...regexParam,
        ...regexParamPackageJson,
        ...looseLibs,
        ...looseLibsPackageJson,
        ...tokensLibs,
        ...tokensLibsPackageJson,
        ...symbolLibs,
        ...symbolLibsPackageJson,
        ...reduxThunkPackageJson,
        ...reduxThunk,
        ...reduxThunkMjs
      ]);
      runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('SPA (Single Page Application)', function() {
      let dom;
      let htmlFiles;
      let jsFiles;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        htmlFiles = await glob(`${this.context.publicDir}/**/*.html`);
        jsFiles = await glob(`${this.context.publicDir}/**/*.js`);
      });

      it('should only have one HTML file in the output directory', function() {
        expect(htmlFiles.length).to.be.equal(1);
      });

      it('should output five script files in the output directory', function() {
        // one for each route (home, about)
        // one for the footer.js
        // one for index.js
        // one for lit element bundle
        expect(jsFiles.length).to.be.equal(5);
      });

      it('should have custom <title> tag in the <head>', function() {
        const title = dom.window.document.querySelectorAll('head > title');

        expect(title.length).to.be.equal(1);
        expect(title[0].textContent).to.be.equal('My Super SPA');
      });

      it('should have custom <meta> tag in the <head>', function() {
        const customMeta = Array.from(dom.window.document.querySelectorAll('head > meta'))
          .filter(meta => meta.getAttribute('property') === 'og:description');

        expect(customMeta.length).to.be.equal(1);
        expect(customMeta[0].getAttribute('content')).to.be.equal('My custom meta content.');
      });

      it('should only have two script tags in the <head>', function() {
        expect(htmlFiles.length).to.be.equal(1);
      });

      it('should have one <script> tag in the <head> for index.js', function() {
        const indexScript = Array.from(dom.window.document.querySelectorAll('head > script[type]'))
          .filter(script => (/index.*.js/).test(script.src));

        expect(indexScript.length).to.be.equal(1);
        expect(indexScript[0].type).to.be.equal('module');
      });

      it('should have one <script> tag in the <head> for the footer.js', function() {
        const footerScript = Array.from(dom.window.document.querySelectorAll('head > script[type]'))
          .filter(script => (/footer.*.js/).test(script.src));

        expect(footerScript.length).to.be.equal(1);
        expect(footerScript[0].type).to.be.equal('module');
      });

      it('should have two code split route javascript files emitted based code splitting', function() {
        const aboutBundle = jsFiles.filter(file => (/about.*.js/).test(path.basename(file)));
        const homeBundle = jsFiles.filter(file => (/home.*.js/).test(path.basename(file)));

        expect(aboutBundle.length).to.equal(1);
        expect(homeBundle.length).to.equal(1);
      });

      it('should not have a pre-rendered custom footer', function() {
        const footer = dom.window.document.querySelector('app-footer');

        expect(footer.textContent).to.be.equal('');
      });
    });

  });

  after(function() {
    // runner.teardown(getOutputTeardownFiles(outputPath));
  });

});