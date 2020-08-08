/*
 * Use Case
 * Run Greenwood with optimization setting in Greenwood config set to strict.
 *
 * User Result
 * Should generate a bare bones Greenwood build with bundle JavaScript and routes.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'spa'
 * }
 *
 * User Workspace
 * Greenwood default w/ nested page
 *  src/
 *   pages/
 *     about/
 *       index.md
 *     hello.md
 *     index.md
 */
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Mode';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'not-found', 'hello'], LABEL);

    describe('Strict', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });
      
      it('should have no <script> tag in the <body>', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');
      
        expect(scriptTags.length).to.be.equal(0);
      });
      
      it('should have no <script> tags in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');

        expect(scriptTags.length).to.be.equal(0);
      });

      it('should have no <script> tags for Apollo state', function() {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const bundleScripts = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
      
        expect(bundleScripts.length).to.be.equal(0);
      });
      
      it('should have a router outlet tag in the <body>', function() {
        const outlet = dom.window.document.querySelectorAll('body eve-app');
      
        expect(outlet.length).to.be.equal(1);
      });
      
      it('should have only 2 route tags in the <body>', function() {
        const routes = dom.window.document.querySelectorAll('body lit-route');
      
        expect(routes.length).to.be.equal(2);
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});