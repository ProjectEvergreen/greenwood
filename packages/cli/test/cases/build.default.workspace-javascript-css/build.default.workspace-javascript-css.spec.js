/*
 * Use Case
 * Run Greenwood with various usages of JavaScript (<script>) and CSS (<style> / <link>) tags.
 *
 * User Result
 * Should generate a bare bones Greenwood build without erroring.
 *
 * User Command
 * greenwood build
 *
 * User Config
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *   scripts/
 *     non-module.js
 *     other.js
 *   styles/
 *     main.css
 *     other.css
 */
import chai from 'chai';
import glob from 'glob-promise';
import { JSDOM } from 'jsdom';
import path from 'path';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Including JavaScript and CSS using <script>, <style>, and <link> tags';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
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

    describe('<script type="module" src="..."></script> tags in the <head>', function() {
      it('should have one <script> tag for other.js loaded in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[type="module"]');
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/other.*[a-z0-9].js/).test(script.src);
        });

        expect(mainScriptTags.length).to.be.equal(1);
      });

      // this includes the non module file in a spec below
      it('should have the expected number of bundled .js files in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '*.*[a-z0-9].js'))).to.have.lengthOf(3);
      });

      it('should have the expected other.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'other.*[a-z0-9].js'))).to.have.lengthOf(1);
      });
    });

    describe('<script ...>...</script> tag in the <head> with mixed attribute ordering', function() {
      it('should have two <script> tag with inline script in the <head>', function() {
        const scriptTagInline = Array.from(dom.window.document.querySelectorAll('head > script:not([src])')).filter(tag => !tag.getAttribute('data-gwd'));

        expect(scriptTagInline.length).to.be.equal(4);
      });

      it('should have the expected inline content from inline <script> tag one in index.html', async function() {
        const scriptTagSrcOne = Array.from(dom.window.document.querySelectorAll('head > script:not([src])')).filter(tag => !tag.getAttribute('data-gwd'))[0];

        expect(scriptTagSrcOne.textContent).to.contain('document.getElementsByClassName("output-script-inline-one")[0].innerHTML="script tag module inline one"');
      });

      it('should have the expected inline content from inline <script> tag two in index.html', async function() {
        const scriptTagSrcTwo = Array.from(dom.window.document.querySelectorAll('head > script:not([src])')).filter(tag => !tag.getAttribute('data-gwd'))[1];

        expect(scriptTagSrcTwo.textContent).to.contain('document.getElementsByClassName("output-script-inline-two")[0].innerHTML="script tag module inline two"');
      });

      it('should have the expected inline content from inline <script> tag three in index.html', async function() {
        const scriptTagSrcTwo = Array.from(dom.window.document.querySelectorAll('head > script:not([src])')).filter(tag => !tag.getAttribute('data-gwd'))[2];

        expect(scriptTagSrcTwo.textContent).to.contain('document.getElementsByClassName("output-script-inline-three")[0].innerHTML="script tag module inline three"');
      });

    });

    describe('non module <script src="..."></script> tag in the <head>', function() {
      it('should have one <script> tag for non-module.js loaded in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script[src]');
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.getAttribute('src');

          return (/non-module.*[a-z0-9].js/).test(src) && src.indexOf('//') < 0;
        });

        expect(mainScriptTags.length).to.be.equal(1);
      });

      it('should have the expected non-module.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'non-module.*[a-z0-9].js'))).to.have.lengthOf(1);
      });
    });

    describe('popup <script src="..."></script> tag in the <body>', function() {
      it('should have one <script> tag for popup.js loaded in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script[src]');
        const popupScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.getAttribute('src');

          return (/popup.*[a-z0-9].js/).test(src) && src.indexOf('//') < 0;
        });

        expect(popupScriptTags.length).to.be.equal(1);
      });

      it('should have the expected popup.js file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'popup.*[a-z0-9].js'))).to.have.lengthOf(1);
      });
    });

    describe('<style>...</style> tag in the <head>', function() {
      it('should have one <style> tag in the <head>', function() {
        const styleTags = dom.window.document.querySelectorAll('head > style');

        expect(styleTags.length).to.be.equal(2);
      });

      it('should have the expected output from the first inline <style> tag in index.html', async function() {
        const styleTags = dom.window.document.querySelectorAll('head > style');

        expect(styleTags[0].textContent.replace(/\n/g, '')).to.equal('p.output-style{color:green}');
      });

      it('should have the expected output from the second inline <style> tag in index.html', async function() {
        const styleTags = dom.window.document.querySelectorAll('head > style');

        expect(styleTags[1].textContent.replace(/\n/g, '')).to.equal('span.output-style{color:red}');
      });

      it('should have the color style for the output element', function() {
        const output = dom.window.document.querySelector('body > p.output-style');
        const computedStyle = dom.window.getComputedStyle(output);

        expect(computedStyle.color).to.equal('green');
      });
    });

    describe('<style>...</style> tag in the <body>', function() {
      it('should have one <style> tag in the <body>', function() {
        const styleTags = dom.window.document.querySelectorAll('body > style');

        expect(styleTags.length).to.be.equal(1);
      });

      it('should have the expected output from the first inline <style> tag in index.html in the <body>', async function() {
        const styleTags = dom.window.document.querySelectorAll('body > style');

        expect(styleTags[0].textContent.replace(/\n/g, '')).to.contain('h1.popup{color:red}');
      });
    });

    describe('<link rel="stylesheet" href="..."/> tag in the <head> with mixed attribute ordering', function() {
      it('should have two <link> tag in the <head>', function() {
        const linkTags = dom.window.document.querySelectorAll('head > link[rel="stylesheet"]');

        expect(linkTags.length).to.be.equal(2);

        linkTags.forEach(link => {
          const href = link.getAttribute('href');
          const hrefPieces = link.getAttribute('href').split('/');

          expect(href).to.be.equal(`/styles/${hrefPieces[2]}`);
        });
      });

      it('should have the expected main.css file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'styles', 'main.*[a-z0-9].css'))).to.have.lengthOf(1);
      });

      it('should have the expected other.css file in the output directory', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'styles', 'other.*[a-z0-9].css'))).to.have.lengthOf(1);
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
    runner.teardown(getOutputTeardownFiles(outputPath));
  });

});