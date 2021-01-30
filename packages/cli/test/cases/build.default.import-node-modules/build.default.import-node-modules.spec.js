/*
 * Use Case
 * Run Greenwood with and loading different module types to ensure support for ESM and MJS node modules resolution.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build without erroring.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Importing packages from node modules';

  let setup;

  before(async function() {
    setup = new TestBed(true);

    // "lit-element": "^2.4.0",
    // "lodash-es": "^4.17.20",
    // "pwa-helpers": "^0.9.1",
    this.context = await setup.setupTestBed(__dirname, [{
      dir: 'node_modules/redux/es',
      name: 'redux.mjs'
    }, {
      dir: 'node_modules/redux/',
      name: 'package.json'
    }, {
      dir: 'node_modules/loose-envify/',
      name: 'index.js'
    }, {
      dir: 'node_modules/loose-envify/',
      name: 'package.json'
    }, {
      dir: 'node_modules/js-tokens/',
      name: 'index.js'
    }, {
      dir: 'node_modules/js-tokens/',
      name: 'package.json'
    }, {
      dir: 'node_modules/symbol-observable/es/',
      name: 'index.js'
    }, {
      dir: 'node_modules/symbol-observable/es/',
      name: 'ponyfill.js'
    }, {
      dir: 'node_modules/symbol-observable/',
      name: 'package.json'
    }]);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('Script tag in the <head> tag', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have one <script> tag for main.js loaded in the <head> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const mainScriptTag = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/main.*.js/).test(script.src);
        });
        
        expect(mainScriptTag.length).to.be.equal(1);
      });

      it('should have the expected main.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'main.*.js'))).to.have.lengthOf(1);
      });

      it('should have the expected output from main.js for redux in the page output', async function() {
        const reduxOutput = dom.window.document.querySelectorAll('body > .output-redux');
        
        expect(reduxOutput.length).to.be.equal(1);
        expect(reduxOutput[0].textContent).to.be.equal('hello from redux ZnVuY3Rpb24gbyh0');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});