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
const { tagsMatch } = require('./utils');

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

      it('should not output any map files for HTML pages', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '**/**/*.html.map'))).to.have.lengthOf(0);
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

      describe('document <html>', function() {
        it('should have an <html> tag with the DOCTYPE attribute', function() {
          expect(html.indexOf('<!DOCTYPE html>')).to.be.equal(0);
        });

        it('should have a <head> tag with the lang attribute on it', function() {
          const htmlTag = dom.window.document.querySelectorAll('html');
    
          expect(htmlTag.length).to.equal(1);
          expect(htmlTag[0].getAttribute('lang')).to.be.equal('en');
          expect(htmlTag[0].getAttribute('prefix')).to.be.equal('og:http://ogp.me/ns#');
        });

        it('should have matching opening and closing <html> tags', function() {
          expect(tagsMatch('html', html, 1)).to.be.equal(true);
        });
      });

      describe('document <head>', function() {
        let metaTags;

        before(function() {
          metaTags = dom.window.document.querySelectorAll('head > meta');
        });

        it('should have matching opening and closing <head> tags in the <head>', function() {
          // add an expclit > here to avoid conflicting with <header>
          // which is used in a lot of test case scaffolding
          expect(tagsMatch('head>', html, 1)).to.be.equal(true);
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

        it('should have default viewport <meta> tag', function() {
          const viewportMeta = Array.from(metaTags).filter(meta => meta.getAttribute('name') === 'viewport');
          
          expect(viewportMeta.length).to.be.equal(1);
          expect(viewportMeta[0].getAttribute('name')).to.be.equal('viewport');
          expect(viewportMeta[0].getAttribute('content')).to.be.equal('width=device-width, initial-scale=1');
        });

        it('should have default charset <meta> tag', function() {
          const chartsetMeta = Array.from(metaTags).filter(meta => meta.getAttribute('charset') === 'utf-8');

          expect(chartsetMeta.length).to.be.equal(1);
          expect(chartsetMeta[0].getAttribute('charset')).to.be.equal('utf-8');
        });
      });

      describe('document <body>', function() {
        it('should have matching opening and closing <body> tags', function() {
          expect(tagsMatch('body', html, 1)).to.be.equal(true);
        });

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

        it('should have no <content-outlet> tags in the <body>', function() {
          const contentOutlet = dom.window.document.querySelectorAll('body content-outlet');
  
          expect(contentOutlet.length).to.be.equal(0);
        });

        it('should have no <page-outlet> tags in the <body>', function() {
          const pageOutlet = dom.window.document.querySelectorAll('body page-outlet');
  
          expect(pageOutlet.length).to.be.equal(0);
        });

        // 
        it('should not have any sourcemap inlining for Rollup HTML entry points', function() {
          expect(html).not.to.contain('//# sourceMappingURL=index.html.map');
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