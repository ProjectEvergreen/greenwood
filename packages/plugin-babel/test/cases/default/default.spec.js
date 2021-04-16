/*
 * Use Case
 * Run Greenwood with Babel processing.
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's JavaScript files processed 
 * based on their own babel.config.js file.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const pluginBabel = require('@greenwod/plugin-babel');
 *
 * {
 *   plugins: [
 *     ...pluginBabel()
 *  ]
 * }
 * 
 * User Workspace
 *  src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 * 
 * User babel.config.js
 * module.exports = {
 *   plugins: [
 *     '@babel/plugin-proposal-class-properties',
 *     '@babel/plugin-proposal-private-methods'
 *   ]
 * };
 */
const fs = require('fs');
const glob = require('glob-promise');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Babel configuration';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'index'], LABEL);    

    describe('Babel should process JavaScript that reference private class members / methods', function() {
      it('should output correctly processed JavaScript without private members', function() {
        const expectedJavaScript = '#x';
        const jsFiles = glob.sync(path.join(this.context.publicDir, '*.js'));
        const javascript = fs.readFileSync(jsFiles[0], 'utf-8');

        expect(jsFiles.length).to.equal(1);
        expect(javascript).to.not.contain(expectedJavaScript);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});