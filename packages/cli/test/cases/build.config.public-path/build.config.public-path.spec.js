/*
 * Use Case
 * Run Greenwood with string publicPath in config and default workspace.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom publicPath
 * from which assets will be served
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   publicPath: '/assets/'
 * }
 */
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Public Path Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    runSmokeTest(['not-found', 'hello'], LABEL);

    describe('Custom Configuration with a custom public path', function() {

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should serve assets from the configured publicPath', function() {
        const publicPath = '/assets/';
        const scriptTags = dom.window.document.querySelectorAll('body script');
        const bundledScripts = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src;

          return src.indexOf('index.') >= 0 && src.indexOf('.bundle.js') >= 0;
        });

        expect(bundledScripts[0].src.indexOf(publicPath) >= 0).to.be.equal(true);
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});