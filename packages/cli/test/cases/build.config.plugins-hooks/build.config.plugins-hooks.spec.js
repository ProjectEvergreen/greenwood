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
 *     type: 'hook',
 *     provider: () => {
 *       return {
 *         hookAnalytics: `
 *           <!-- some analytics code -->
 *         `
 *       };
 *     }
 *   }, {
 *     type: 'hook',
 *     provider: () => {
 *       return {
 *         hookPolyfills: `
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
  const LABEL = 'Custom Hook Plugins and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed(true);
    this.context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, function() {
    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });
    
    runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);

    describe('Custom Hooks', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have placeholder for hookAnalytics', function() {
        const placeholder = dom.window.document.querySelectorAll('body div.hook-analytics');
        
        expect(placeholder.length).to.be.equal(1);
      });

      it('should have placeholder for hookPolyfills', function() {
        const placeholder = dom.window.document.querySelectorAll('body div.hook-polyfills');

        expect(placeholder.length).to.be.equal(1);
      });
    });
  });
  
  after(function() {
    setup.teardownTestBed();
  });

});