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
const runSmokeTest = require('../../smoke-test');
const TestBed = require('../../test-bed');

describe.only('Build Greenwood With: ', async function() {
  const LABEL = 'Custom Title Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, function() {
    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });
    runSmokeTest(['not-found', 'hello', 'meta'], LABEL);

    describe('Custom Configuration with a custom public path', () => {

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should serve assets from the configured publicPath', async () => {
        const asset = dom.window.document.querySelector('body > script').getAttribute('src');
        const publicPath = '/assets/';

        expect(asset.substring(0, 8)).to.be.equal(publicPath);
      });
    });

  });
    
  // after(function() {
  //   setup.teardownTestBed();
  // });

});