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
const glob = require('glob-promise');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');
const { version } = require('../../../package.json');

describe('Build Greenwood With: ', function() {
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
        const files = await glob(`${this.context.publicDir}/index.*.bundle.js`);
        
        bundleFile = files[0];
      });

      it('should have the banner text in index.js', function() {
        const fileContents = fs.readFileSync(bundleFile, 'utf8');

        expect(fileContents).to.contain(mockBanner);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});