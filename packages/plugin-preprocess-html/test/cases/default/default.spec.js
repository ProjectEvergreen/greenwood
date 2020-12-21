/*
 * Use Case
 * Run Greenwood with pre-process html transform plugin with default options.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build with html injected before default html transform within index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const preProcessHTMLTransformPlugin = require('@greenwood/plugin-preprocess-html');
 *
 * {
 *   plugins: [{
 *     ...preProcessHTMLTransformPlugin()
 *  }]
 *
 * }
 *
 * User Workspace
 * Greenwood default (src/)
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Pre-Process HTML Plugin with default options and Default Workspace';

  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('body', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should contain the preprocess injected html', function() {
        const header = dom.window.document.querySelector('h1');

        expect(header.textContent).to.be.equal('test pre process plugin');
      });

    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});