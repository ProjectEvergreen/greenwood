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
 *     other.js
 *   styles/
 *     main.css
 *     other.css
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Importing JavaScript and CSS using <script>, <style>, and <link> tags';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');

      dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
    });

    describe('<script type="module" src="..."></script> tag in the <head>', function() {
      it('should have one <script> tag for main.js loaded in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[src]');
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/main.*.js/).test(script.src);
        });
        
        expect(mainScriptTags.length).to.be.equal(1);
      });

      it('should have one <script> tag for other.js loaded in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[src]');
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/other.*.js/).test(script.src);
        });
        
        expect(mainScriptTags.length).to.be.equal(1);
      });

      it('should have the expected number of bundled .js files in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '*.js'))).to.have.lengthOf(2);
      });

      it('should have the expected main.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'main.*.js'))).to.have.lengthOf(1);
      });

      it('should have the expected other.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'other.*.js'))).to.have.lengthOf(1);
      });

      it('should have the expected output from main.js file in index.html', async function() {
        const scriptTagSrc = dom.window.document.querySelector('body > .output-script-src');

        expect(scriptTagSrc.textContent).to.be.equal('script tag module with src');
      });
    });

    describe('<script>...</script> tag in the <head> with mixed attribute ordering', function() {
      it('should have two <script> tag with inline script in the <head>', function() {
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

    describe('<link rel="stylesheet" href="..."/> tag in the <head> with mixed attribute ordering', function() {
      it('should have two <link> tag in the <head>', function() {
        const linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');
        
        expect(linkTags.length).to.be.equal(2);
      });

      it('should have the expected main.css file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'styles', 'main.*.css'))).to.have.lengthOf(1);
      });

      it('should have the expected other.css file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'styles', 'other.*.css'))).to.have.lengthOf(1);
      });

      // JSDOM may not support this case of computing styles when using a <link> tag?
      // https://github.com/jsdom/jsdom/issues/2986
      xit('should have the color style for the output element', function() {
        const output = dom.window.document.querySelector('body > p.output-link');
        const computedStyle = dom.window.getComputedStyle(output);

        expect(computedStyle.color).to.equal('blue');
      });
    });

    describe('untouched content in the <body> for type="module-shim"', function() {
      it('should have two <link> tag in the <head>', function() {
        const output = dom.window.document.querySelectorAll('p.module-shim');

        expect(output.length).to.be.equal(1);
        expect(output[0].textContent).to.be.equal('let me tell you about type="module-shim"');
      });
    });
  });

  after(function() {
    runner.teardown();
  });

});