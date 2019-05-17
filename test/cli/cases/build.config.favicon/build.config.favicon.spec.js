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
 *   workspace: 'src',
 *   favicon: {
 *     logo: path.join(__dirname, 'src', 'logo.png'),
 *     background: '#000000'
 *   }
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
  const LABEL = 'Custom Favicon Configuration and Default Workspace';
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

    describe('Custom Favicon Index Page', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have our custom config favicon manifest.json', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './icons', 'manifest.json'))).to.be.true;
      });

      it('should have generated custom favicon using our config logo', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './icons', 'favicon-32x32.png'))).to.be.true;
      });

      it('should have injected the favicon into the DOM', function() {
        const metaElement = dom.window.document.querySelector('head link[rel="shortcut icon"]');

        expect(metaElement.getAttribute('href')).to.be.equal('/icons/favicon.ico');
      });

      it('should have injected the application-name <meta>', function() {
        const metaElement = dom.window.document.querySelector('head meta[name="application-name"]');

        expect(metaElement.getAttribute('content')).to.be.equal('Greenwood App');
      });

      it('should have injected the theme-color <meta>', function() {
        const metaElement = dom.window.document.querySelector('head meta[name="theme-color"]');

        expect(metaElement.getAttribute('content')).to.be.equal('#000000');
      });
    });
  });  
  after(function() {
    setup.teardownTestBed();
  });
});