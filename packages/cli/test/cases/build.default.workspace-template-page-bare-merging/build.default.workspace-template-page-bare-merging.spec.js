/*
 * Use Case
 * Run Greenwood build command with no config and emplty page templates.
 *
 * User Result
 * Should generate a bare bones Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   pages/
 *     index.md
 *   templates/
 *     page.html
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace for Quick Start';
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
  
    describe('Default output for index.html', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      // TODO test with no <head> tag in user page.html
      describe('head section tags', function() {
        let metaTags;

        before(function() {
          metaTags = dom.window.document.querySelectorAll('head > meta');
        });

        it('should have a <title> tag in the <head>', function() {
          const title = dom.window.document.querySelector('head title').textContent;
    
          expect(title).to.be.equal('My App');
        });

        it('should have five default <meta> tags in the <head>', function() {
          expect(metaTags.length).to.be.equal(5);
        });

        it('should have default charset <meta> tag', function() {
          expect(metaTags[0].getAttribute('charset')).to.be.equal('utf-8');
        });

        it('should have default viewport <meta> tag', function() {
          const viewportMeta = metaTags[1];
          
          expect(viewportMeta.getAttribute('name')).to.be.equal('viewport');
          expect(viewportMeta.getAttribute('content')).to.be.equal('width=device-width, initial-scale=1');
        });

        it('should have default mobile-web-app-capable <meta> tag', function() {
          const mwacMeta = metaTags[2];

          expect(mwacMeta.getAttribute('name')).to.be.equal('mobile-web-app-capable');
          expect(mwacMeta.getAttribute('content')).to.be.equal('yes');
        });

        it('should have default apple-mobile-web-app-capable <meta> tag', function() {
          const amwacMeta = metaTags[3];

          expect(amwacMeta.getAttribute('name')).to.be.equal('apple-mobile-web-app-capable');
          expect(amwacMeta.getAttribute('content')).to.be.equal('yes');
        });

        it('should have default apple-mobile-web-app-status-bar-style <meta> tag', function() {
          const amwasbsMeta = metaTags[4];

          expect(amwasbsMeta.getAttribute('name')).to.be.equal('apple-mobile-web-app-status-bar-style');
          expect(amwasbsMeta.getAttribute('content')).to.be.equal('black');
        });
      });

      describe('expected content output in <body> tag', function() {
        it('should have expected h2 tag in the <body>', function() {
          const h1 = dom.window.document.querySelectorAll('body h1');
    
          expect(h1.length).to.be.equal(1);
          expect(h1[0].textContent).to.be.equal('Page Template Heading');
        });

        it('should have expected h2 tag in the <body>', function() {
          const h2 = dom.window.document.querySelectorAll('body h2');
    
          expect(h2.length).to.be.equal(1);
          expect(h2[0].textContent).to.be.equal('Quick Start');
        });
  
        it('should have expected content output tag in the <body>', function() {
          const p = dom.window.document.querySelectorAll('body p');
  
          expect(p.length).to.be.equal(1);
          expect(p[0].textContent).to.be.equal('This is a test.');
        });
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});