/*
 * Use Case
 * Run Greenwood with a custom themeFile file in config and default workspace with a page template.
 * 
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom theme styles
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {
 *   title: 'My Custom Greenwood App'
 * }
 * 
 * User Workspace
 * Greenwood default 
 *  src/
 *   templates/
 *     page-template.js
 *   styles/
 *     my-brand.css
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Custom Theme Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();

    this.context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, function() {
    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'not-found', 'index'], LABEL);

    describe('Theme Styled Page Template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom styled page template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the expected font import', async function() {
        const styles = '@import url(//fonts.googleapis.com/css?family=Roboto';
        const styleTags = dom.window.document.querySelectorAll('head style');
        let importCount = 0;

        styleTags.forEach((tag) => {
          if (tag.textContent.indexOf(styles) >= 0) {
            importCount += 1;
          }
        });

        expect(importCount).to.equal(1);
      });

      it('should have the expected font family', async function() {
        const styles = 'body{font-family:Roboto,sans-serif}';
        const styleTags = dom.window.document.querySelectorAll('head style');
        let fontCount = 0;

        styleTags.forEach((tag) => {
          if (tag.textContent.indexOf(styles) >= 0) {
            fontCount += 1;
          }
        });

        expect(fontCount).to.equal(1);
      });

    });
    
  });

  after(function() {
    setup.teardownTestBed();
  });
  
});