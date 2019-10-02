/*
 * Use Case
 * Run Greenwood with some plugins and default workspace.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build with certain plugins injected into index.html.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   plugins: [{
 *     type: 'index',
 *     provider: () => {
 *       return {
 *         hookGreenwoodAnalytics: `
 *           <!-- some analytics code -->
 *         `
 *       };
 *     }
 *   }, {
 *     type: 'index',
 *     provider: () => {
 *       return {
 *         hookGreenwoodPolyfills: `
 *           <!-- some polyfills code -->
 *         `
 *       };
 *     }
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
  const LABEL = 'Custom Index Plugin and Default Workspace';
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

    describe('Custom Index Hooks', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have placeholder for hookGreenwoodAnalytics', function() {
        const placeholder = dom.window.document.querySelectorAll('body div.hook-analytics');

        expect(placeholder.length).to.be.equal(1);
      });

      // it('should have placeholder for hookGreenwoodPolyfills', function() {
      //   const placeholder = dom.window.document.querySelectorAll('body div.hook-polyfills');

      //   expect(placeholder.length).to.be.equal(1);
      // });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});