/*
 * This module can be used to run a suite of smoke tests for any CLI based test case to
 * verify default behavior and output.  Can be run a-la carte to help reduce duplication and
 * boilerplate when writing tests.
 *
 * There are a number of examples in the CLI package you can use as a reference.
 *
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');

function tagsMatch(tagName, html) {
  const openTagRegex = new RegExp(`<${tagName}`, 'g');
  const closeTagRegex = new RegExp(`<\/${tagName.replace('>', '')}>`, 'g');
  const openingCount = (html.match(openTagRegex) || []).length;
  const closingCount = (html.match(closeTagRegex) || []).length;
  
  return openingCount === closingCount;
}

function publicDirectory(label) {
  describe(`Running Smoke Tests: ${label}`, function() {
    describe('Public Directory Generated Output', function() {
      it('should create a public directory', function() {
        expect(fs.existsSync(this.context.publicDir)).to.be.true;
      });

      it('should output a single index.html file (home page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should output one graph.json file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'graph.json'))).to.have.lengthOf(1);
      });
    });
  });
}

function defaultIndex(label) {
  describe(`Running Smoke Tests: ${label}`, function() {
    describe('Index (Home) page', function() {
      let dom;
      let html;

      before(async function() {
        const htmlPath = path.resolve(this.context.publicDir, 'index.html');

        dom = await JSDOM.fromFile(htmlPath);
        html = await fs.promises.readFile(htmlPath, 'utf-8');
      });

      describe('document <head>', function() {
        it('should have matching opening and closing <head> tags in the <head>', function() {
          // add an expclit > here to avoid conflicting with <header>
          // which is used in a lot of test case scaffolding
          expect(tagsMatch('head>', html)).to.be.equal(true);
        });
  
        it('should have a <title> tag in the <head>', function() {
          const title = dom.window.document.querySelector('head title').textContent;
  
          expect(title).to.not.be.undefined;
        });

        it('should have matching opening and closing <script> tags in the <head>', function() {
          expect(tagsMatch('script', html)).to.be.equal(true);
        });

        it('should have matching opening and closing <link> tags in the <head>', function() {
          const html = dom.window.document.querySelector('html').textContent;
  
          expect(tagsMatch('link', html)).to.be.equal(true);
        });

        // note: one will always be present when using puppeteer
        it('should have matching opening and closing <style> tags in the <head>', function() {
          expect(tagsMatch('style', html)).to.be.equal(true);
        });
      });

      describe('document <body>', function() {
        it('should have no <script> tags in the <body>', function() {
          const bodyScripts = dom.window.document.querySelectorAll('body script');
  
          expect(bodyScripts.length).to.be.equal(0);
        });
  
        it('should have no <link> tags in the <body>', function() {
          const bodyLinks = dom.window.document.querySelectorAll('body link');
  
          expect(bodyLinks.length).to.be.equal(0);
        });
  
        it('should have no <style> tags in the <body>', function() {
          const bodyStyles = dom.window.document.querySelectorAll('body style');
  
          expect(bodyStyles.length).to.be.equal(0);
        });
  
        it('should have no <meta> tags in the <body>', function() {
          const bodyMetas = dom.window.document.querySelectorAll('body meta');
  
          expect(bodyMetas.length).to.be.equal(0);
        });
      });
    });
  });
}

module.exports = runSmokeTest = async function(testCases, label) {

  testCases.forEach(async (testCase) => {
    switch (testCase) {

      case 'index':
        defaultIndex(label);
        break;
      case 'public':
        publicDirectory(label);
        break;
      default:
        console.warn(`unknown case ${testCase}`);
        break;

    }
  });
};