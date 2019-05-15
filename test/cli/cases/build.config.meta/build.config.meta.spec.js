/*
 * Use Case
 * Run Greenwood with meta config object and default workspace.
 * 
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with meta data
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {
 *   title: 'My Custom Greenwood App',
 *   meta: [
 *     { property: 'og:site', content: 'greenwood' },
 *     { name: 'twitter:site', content: '@PrjEvergreen' }
 *   ]
 * }
 * 
 * User Workspace
 * Greenwood default 
 *  src/
 *   pages/
 *     index.md
 *     hello.md
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../smoke-test');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Custom Meta Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, function() {
    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });
    runSmokeTest(['public', 'index', 'not-found', 'hello', 'meta'], LABEL);

    describe('Custom Meta Index Page', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have our custom config <meta> tag with og:site property in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="og:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('greenwood');
      });

      it('should have our custom config <meta> tag with twitter:site name in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[name="twitter:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('@PrjEvergreen');
      });
    });
  });  
  after(function() {
    setup.teardownTestBed();
  });
});