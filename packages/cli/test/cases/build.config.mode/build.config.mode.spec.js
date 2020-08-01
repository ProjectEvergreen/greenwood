/*
 * Use Case
 * Run Greenwood with mode setting in Greenwood config set to spa.
 *
 * User Result
 * Should generate a bare bones Greenwood build with bundle JavaScript and routes.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   mode: 'spa'
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

const mainBundleScriptRegex = /index.*.bundle\.js/;

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

    describe('SPA', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });
      
      it('should have one <script> tag in the <body> for the main bundle', function() {
        const scriptTags = dom.window.document.querySelectorAll('body app-root ~ script');
        const bundledScript = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src.replace('file:///', '');
      
          return mainBundleScriptRegex.test(src);
        });
      
        expect(bundledScript.length).to.be.equal(1);
      });
      
      it('should have one <script> tag in the <body> for the main bundle loaded asynchronously', function() {
        const scriptTags = dom.window.document.querySelectorAll('body app-root ~ script');
        const bundledScript = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src.replace('file:///', '');

          return mainBundleScriptRegex.test(src);
        });

        expect(bundledScript[0].getAttribute('async')).to.be.equal('true');
      });

      it('should have one <script> tag for Apollo state', function() {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const bundleScripts = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
      
        expect(bundleScripts.length).to.be.equal(1);
      });
      
      it('should have a router outlet tag in the <body>', function() {
        const outlet = dom.window.document.querySelectorAll('body eve-app');
      
        expect(outlet.length).to.be.equal(1);
      });
      
      it('should have the correct route tags in the <body>', function() {
        const routes = dom.window.document.querySelectorAll('body lit-route');
      
        expect(routes.length).to.be.equal(4);
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});