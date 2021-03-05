/*
 * Use Case
 * Run Greenwood with Babel processing merging user and default babel.config.js files.
 *
 * User Result
 * Should generate a bare bones Greenwood build with the user's JavaScript files processed 
 * based on their own babel.config.js file merged with plugin default babel.config.js file.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const pluginBabel = require('@greenwod/plugin-babel');
 *
 * {
 *   plugins: [
 *     ...pluginBabel({
 *        extendConfig: true
 *     })
 *   ]
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
// const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Babel Options for extending Default Configuration';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    let jsFiles;

    before(async function() {
      await setup.runGreenwoodCommand('build');

      jsFiles = glob.sync(path.join(this.context.publicDir, '*.js'));
    });

    // TODO runSmokeTest(['public', 'index', 'not-found'], LABEL);    

    it('should output one JavaScript file', function() {
      expect(jsFiles.length).to.equal(1);
    });

    describe('Babel should process JavaScript that reference private class members / methods', function() {
      it('should output correctly processed JavaScript without private members', function() {
        const notExpectedJavaScript = '#x;';
        const javascript = fs.readFileSync(jsFiles[0], 'utf-8');

        expect(javascript).to.not.contain(notExpectedJavaScript);
      });
    });

    // find a better way to test for preset-env specifically?
    xdescribe('Babel should handle processing of JavaScript per usage of @babel/preset-env', function() {
      it('should output correctly processed JavaScript...', function() {
        const expectedJavaScript = 'return e&&e.__esModule';
        const javascript = fs.readFileSync(jsFiles[0], 'utf-8');

        expect(javascript).to.contain(expectedJavaScript);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});