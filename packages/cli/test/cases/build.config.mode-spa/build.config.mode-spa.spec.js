/*
 * Use Case
 * Run Greenwood with mode setting in Greenwood config set to spa.
 *
 * User Result
 * Should generate a bare bones Greenwood build for hosting a Single Page Application.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   mode: 'spa'
 * }
 *
 * User Workspace
 * Greenwood default w/ single index.html file
 *  src/
 *   components/
 *     footer.js
 *   index.js
 *   index.html
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles, getDependencyFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const runSmokeTest = require('../../../../../test/smoke-test');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Mode';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(async function() {
    this.context = { 
      publicDir: path.join(outputPath, 'public') 
    };
    runner = new Runner(true);
  });

  describe(LABEL, function() {

    before(async function() {
      const litElementLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/lib/*.js`, 
        `${outputPath}/node_modules/lit-element/lib/`
      );
      const litElement = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/lit-element.js`, 
        `${outputPath}/node_modules/lit-element/`
      );
      const litElementPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-element/package.json`, 
        `${outputPath}/node_modules/lit-element/`
      );
      const litHtml = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lit-html.js`, 
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlPackageJson = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/package.json`, 
        `${outputPath}/node_modules/lit-html/`
      );
      const litHtmlLibs = await getDependencyFiles(
        `${process.cwd()}/node_modules/lit-html/lib/*.js`, 
        `${outputPath}/node_modules/lit-html/lib/`
      );

      await runner.setup(outputPath, [
        ...getSetupFiles(outputPath),
        ...litElementLibs,
        ...litElement,
        ...litElementPackageJson,
        ...litHtmlPackageJson,
        ...litHtml,
        ...litHtmlLibs
      ]);
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('SPA (Single Page Application)', function() {
      let dom;
      let htmlFiles;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        htmlFiles = await glob(`${this.context.publicDir}/**/*.html`);
      });
      
      it('should only have one HTML file in the output directory', function() {
        expect(htmlFiles.length).to.be.equal(1);
      });

      it('should have one <script> tag in the <head> for the footer', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[type]');

        expect(scriptTags.length).to.be.equal(1);
        expect(scriptTags[0].href).to.be.contain(/footer.*.js/);
        expect(scriptTags[0].type).to.be.equal('module');
      });

      xit('shuuld not have a pre-rendered custom footer', function() {

      });

      xit('shuuld have appropraiate route based code splitting', function() {

      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});