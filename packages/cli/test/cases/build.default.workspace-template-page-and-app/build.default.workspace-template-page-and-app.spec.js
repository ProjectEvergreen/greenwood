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
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App and Page Templates';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'index'], LABEL);

    describe('Custom App and Page Templates', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should have the specific element we added as part of our custom page template', function() {
        const customElement = dom.window.document.querySelectorAll('div.owen-test');

        expect(customElement.length).to.equal(1);
      });

      describe('merge order for app and page template <head> tags', function() {
        let scriptTags;
        let linkTags;
        let styleTags;

        before(function() {
          scriptTags = dom.window.document.querySelectorAll('head > script');
          linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"');
          styleTags = dom.window.document.querySelectorAll('head > style');
        });

        it('should have 4 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(4);
        });

        it('should have 4 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(4);
        });

        it('should have 5 <style> tags in the <head> (4 + one from Puppeteer)', function() {
          expect(styleTags.length).to.equal(5);
        });

        it('should merge page template <script> tags after app template <script> tags', function() {
          expect(scriptTags[0].src).to.match(/app-template-one.*.js/);
          expect(scriptTags[1].src).to.match(/app-template-two.*.js/);
          expect(scriptTags[2].src).to.match(/page-template-one.*.js/);
          expect(scriptTags[3].src).to.match(/page-template-two.*.js/);

          scriptTags.forEach((scriptTag) => {
            expect(scriptTag.type).to.equal('module');
          });
        });

        it('should merge page template <link> tags after app template <link> tags', function() {
          expect(linkTags[0].href).to.match(/app-template-one.*.css/);
          expect(linkTags[1].href).to.match(/app-template-two.*.css/);
          expect(linkTags[2].href).to.match(/page-template-one.*.css/);
          expect(linkTags[3].href).to.match(/page-template-two.*.css/);

          linkTags.forEach((linkTag) => {
            expect(linkTag.rel).to.equal('stylesheet');
          });
        });

        it('should merge page template <style> tags after app template <style> tags', function() {
          // offset index by one since first <style> tag is from Puppeteer
          expect(styleTags[1].textContent).to.contain('app-template-one-style');
          expect(styleTags[2].textContent).to.contain('app-template-two-style');
          expect(styleTags[3].textContent).to.contain('page-template-one-style');
          expect(styleTags[4].textContent).to.contain('page-template-two-style');
        });
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });
});