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
 * const webpack = require('webpack');
 * 
 * {
 *   plugins: [{
 *     type: 'weboack',
 *     provider: () => {
 *       return new webpack.BannerPlugin('Some custom text')
 *     }
 *   }]
 * }
 * 
 * User Workspace
 * Greenwood default (src/)
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');
const { version } = require('../../../package.json');

describe('Build Greenwood With: ', async function() {
  const mockBanner = `My Banner - v${version}`;
  const LABEL = 'Custom Webpack Plugin and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, function() {
    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });
    
    runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);

    describe('Banner Plugin', function() {
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