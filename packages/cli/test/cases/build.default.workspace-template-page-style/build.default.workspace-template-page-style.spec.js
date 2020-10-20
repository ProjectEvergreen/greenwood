/*
 * Use Case
 * Run Greenwood build command with no config and custom styled page template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom styled page template.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   styles/
 *     style.css
 *     theme.css
 *   templates/
 *     page-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TestBed = require('../../../../../test/test-bed');

xdescribe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Style and Theme Page Template';
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

    describe('Custom Styled Page Template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom styled page template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the color style for the .owen-test element in the page template that we added as part of our custom style', function() {

        const customElement = dom.window.document.querySelector('.owen-test');
        const computedStyle = dom.window.getComputedStyle(customElement);

        expect(computedStyle.color).to.equal('rgb(0, 0, 255)');
      });

      it('should have the color styles for the h3 element that we defined as part of our custom style', function() {

        const customHeader = dom.window.document.querySelector('h3');
        const computedStyle = dom.window.getComputedStyle(customHeader);

        expect(computedStyle.color).to.equal('green');
      });
    });

    describe('Theme Styled Page Template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have the expected font import', async function() {
        const styles = '@import url(//fonts.googleapis.com/css?family=Source+Sans+Pro&display=swap);';
        const styleTags = dom.window.document.querySelectorAll('head style');
        let importCount = 0;

        styleTags.forEach((tag) => {
          if (tag.textContent.indexOf(styles) >= 0) {
            importCount += 1;
          }
        });

        expect(importCount).to.equal(1);
      });

      it('should have the expected font family', function() {
        const styles = 'body{font-family:Source Sans Pro,sans-serif}';
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