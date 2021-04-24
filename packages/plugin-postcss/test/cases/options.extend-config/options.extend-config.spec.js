/*
 * Use Case
 * Run Greenwood with a custom PostCSS config
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's CSS file correctly un-nested and minified
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const pluginPostCss = require('@greenwod/plugin-postcss');
 *
 * {
 *   plugins: [
 *     pluginPostCss()
 *  ]
 * }
 * 
 * User Workspace
 *  src/
 *   pages/
 *     index.html
 *   styles/
 *     main.css
 * 
 * User postcss.config.js
 * module.exports = {
 *   plugins: [
 *     require('postcss-nested')
 *   ]
 * };
 */
const fs = require('fs');
const glob = require('glob-promise');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom PostCSS configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Page referencing external nested CSS file', function() {
      it('should output correctly processed nested CSS as non nested', function() {
        const expectedCss = 'body{color:red}body h1{color:#00f}';
        const cssFiles = glob.sync(path.join(this.context.publicDir, 'styles', '*.css'));
        const css = fs.readFileSync(cssFiles[0], 'utf-8');

        expect(cssFiles.length).to.equal(1);
        expect(css).to.equal(expectedCss);
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});