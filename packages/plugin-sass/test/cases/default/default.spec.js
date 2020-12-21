/*
 * Use Case
 * Run Greenwood with Sass transform plugin with default options.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build with sass injected into header component within index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const sassPlugin = require('@greenwod/plugin-sass');
 *
 * {
 *   plugins: [{
 *     ...sassPlugin()
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

describe.only('Build Greenwood With: ', function() {
  const LABEL = 'Sass Plugin with default options and Default Workspace';

  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('header component class', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should contain the correct background color compiled from scss file', function() {
        const header = dom.window.document.querySelector('eve-header > style');
        const compiledStyle = '\n      .header {   background-color: red;   width: 100vw;   height: 100vh; } \n      ';
        expect(header.innerHTML).to.be.equal(compiledStyle);
      });

    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});