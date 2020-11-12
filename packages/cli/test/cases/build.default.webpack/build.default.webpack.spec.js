/*
 * Use Case
 * Run Greenwood with a custom webpack config and default workspace.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom webpack changes
 *
 * User Command
 * greenwood build
 *
 * User Workspace
 * Greenwood default
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');
const { version } = require('../../../package.json');

xdescribe('Build Greenwood With: ', function() {
  const mockBanner = `My Banner - v${version}`;
  const LABEL = 'Custom Webpack Configuration';
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

    describe('using a custom webpack.config.common.js with banner plugin', function() {
      let bundleFile;

      beforeEach(async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
        const scriptTags = dom.window.document.querySelectorAll('body script');
        const bundleScripts = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src;

          return src.indexOf('index.') >= 0 && src.indexOf('.bundle.js') >= 0;
        });

        bundleFile = bundleScripts[0].src.replace('file:///', '');
      });

      it('should have the banner text in index.js', function() {
        const fileContents = fs.readFileSync(path.resolve(this.context.publicDir, bundleFile), 'utf8');

        expect(fileContents).to.contain(mockBanner);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});