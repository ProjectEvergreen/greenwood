/*
 * Use Case
 * Run Greenwood with various usages of JavaScript (<script>) and CSS (<style> / <link>) tags, with inlined or file based content.
 *
 * Uaer Result
 * Should generate a bare bones Greenwood build without erroring.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   scripts/
 *     main.js
 *   styles/
 *     
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Importing JavaScript and CSS using <script>, <style>, and <link> tags';

  let setup;

  before(async function() {
    setup = new TestBed(true);

    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await setup.runGreenwoodCommand('build');

      dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
    });

    describe('<script type="module" src="..."></script> tag in the <head>', function() {
      it('should have one <script> tag for main.js loaded in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[src]');
        const mainScriptTag = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/.*.js/).test(script.src);
        });
        
        expect(mainScriptTag.length).to.be.equal(1);
      });

      it('should have the expected main.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'main.*.js'))).to.have.lengthOf(1);
      });

      it('should have the expected output from main.js file in index.html', async function() {
        const scriptTagSrc = dom.window.document.querySelector('body > .output-script-src');

        expect(scriptTagSrc.textContent).to.be.equal('script tag module with src');
      });
    });

    describe('<script>...</script> tag in the <head>', function() {
      it('should have one <script> tag with inline script in the <head>', function() {
        const scriptTagInline = dom.window.document.querySelectorAll('head > script:not([src])');
        
        expect(scriptTagInline.length).to.be.equal(1);
      });

      it('should have the expected output from inline <script> tag in index.html', async function() {
        const scriptTagSrc = dom.window.document.querySelector('body > .output-script-inline');

        expect(scriptTagSrc.textContent).to.be.equal('script tag module inline');
      });
    });

    describe('<style>...</style> tag in the <head>', function() {
      it('should have one <style> tag in the <head>', function() {
        const styleTags = dom.window.document.querySelectorAll('head > style');
        
        // first <style> tag comes from puppeteer output
        expect(styleTags.length).to.be.equal(2);
      });

      it('should have the expected output from main.js file in index.html', async function() {
        const styleTags = dom.window.document.querySelectorAll('head > style');

        // first <style> tag comes from puppeteer output
        expect(styleTags[1].textContent.replace(/\n/g, '').trim().replace(' ', '')).to.be.contain('p.output-style{        color: green;      }');
      });

      it('should have the color style for the output element', function() {
        const output = dom.window.document.querySelector('body > p.output-style');
        const computedStyle = dom.window.getComputedStyle(output);

        expect(computedStyle.color).to.equal('green');
      });
    });

    describe('<link rel="stylesheet" href="..."/> tag in the <head>', function() {
      it('should have one <link> tag in the <head>', function() {
        const linkTags = dom.window.document.querySelectorAll('head > link');
        
        expect(linkTags.length).to.be.equal(1);
      });

      it('should have the expected main.css file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'styles', 'main.*.css'))).to.have.lengthOf(1);
      });

      // JSDOM may not support this case of computing styles when using a <link> tag?
      // https://github.com/jsdom/jsdom/issues/2986
      xit('should have the color style for the output element', function() {
        const output = dom.window.document.querySelector('body > p.output-link');
        const computedStyle = dom.window.getComputedStyle(output);

        expect(computedStyle.color).to.equal('blue');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});