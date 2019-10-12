/*
 * Use Case
 * Run Greenwood with Polyfills composite plugin with default options.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build with polyfills injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * const polyfillsPlugin = require('@greenwod/plugin-polyfills');
 *
 * {
 *   plugins: [{
 *     ...polyfillsPlugin()
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
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Polyfill Plugin with default options and Default Workspace';

  let setup;

  before(async function() {
    setup = new TestBed();

    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);

    describe('Script tag in the <head> tag', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have one <script> tag for polyfills loaded in the <head> tag', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const polyfillScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.src.indexOf('/webcomponents-bundle.js') >= 0;
        });

        expect(polyfillScriptTags.length).to.be.equal(1);
      });

    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});