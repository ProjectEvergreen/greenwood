/*
 * Use Case
 * Run Greenwood build command with no config and custom page (and app) template.
 *
 * User Result
 * Should generate a bare bones Greenwood build with custom page template.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   scripts/
 *     app-template-one.js
 *     app-template-two.js
 *     page-template-one.js
 *     page-template-two.js
  *   styles/
 *     app-template-one.css
 *     app-template-two.css
 *     page-template-one.css
 *     page-template-two.css
 *   templates/
 *     app.html
 *     page.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App and Page Template';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);

    describe('Custom Page Template', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom page template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the specific element we added as part of our custom page template', function() {
        const customElement = dom.window.document.querySelectorAll('div.owen-test');

        expect(customElement.length).to.equal(1);
      });

      describe('merge order for app and page template <head> tags', function() {
        let scriptTags;
        let linkTags;

        before(function() {
          scriptTags = dom.window.document.querySelectorAll('head > script');
          linkTags = dom.window.document.querySelectorAll('head > link');
        });

        it('should have 4 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(4);
        });

        it('should have 4 <link> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(4);
        });

        it('should merge page template <script> tags after app template <script> tags', function() {
          expect(scriptTags[0].src).to.match(/app-template-one.*.js/);
          expect(scriptTags[1].src).to.match(/app-template-two.*.js/);
          expect(scriptTags[2].src).to.match(/page-template-one.*.js/);
          expect(scriptTags[3].src).to.match(/page-template-two.*.js/);
        });

        it('should merge page template <link> tags after app template <link> tags', function() {
          expect(linkTags[0].href).to.match(/app-template-one.*.css/);
          expect(linkTags[1].href).to.match(/app-template-two.*.css/);
          expect(linkTags[2].href).to.match(/page-template-one.*.css/);
          expect(linkTags[3].href).to.match(/page-template-two.*.css/);
        });

        // TODO
        xit('should merge page template <style> tags after app template <style> tags', function() {

        });
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });
});