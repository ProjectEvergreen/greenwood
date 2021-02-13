/*
 * Use Case
 * Run Greenwood build command with no config and custom page template.
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
 *   scripts
 *     main.js
 *   styles/
 *     theme.css
 *   templates/
 *     page.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Page Template';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['not-found'], LABEL);

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

      describe('correct merge order for default app and custom page template <head> tags', function() {
        let scriptTags;
        let linkTags;
        let styleTags;

        before(function() {
          scriptTags = dom.window.document.querySelectorAll('head > script');
          linkTags = dom.window.document.querySelectorAll('head > link');
          styleTags = dom.window.document.querySelectorAll('head > style');
        });

        it('should have 1 <script> tags in the <head>', function() {
          expect(scriptTags.length).to.equal(1);
        });

        it('should have 1 <link> tags in the <head>', function() {
          expect(linkTags.length).to.equal(1);
        });

        it('should have 2 <style> tags in the <head> (1 + one from Puppeteer)', function() {
          expect(styleTags.length).to.equal(2);
        });

        it('should add one page template <script> tag', function() {
          expect(scriptTags[0].src).to.match(/main.*.js/);
        });

        it('should add one page template <link> tag', function() {
          expect(linkTags[0].href).to.match(/styles\/theme.*.css/);
        });

        it('should add one page template <style> tag', function() {
          // offset index by one since first <style> tag is from Puppeteer
          expect(styleTags[1].textContent).to.contain('.owen-test');
        });
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });
});