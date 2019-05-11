/*
 * Use Case
 * Run Greenwood with meta config object and default workspace.
 * 
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with meta data
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {
 *   title: 'My Custom Greenwood App',
 *   meta: [
 *     { property: 'og:site', content: 'greenwood' },
 *     { name: 'twitter:site', content: '@PrjEvergreen' }
 *   ]
 * }
 * 
 * User Workspace
 * Greenwood default 
 *  src/
 *   pages/
 *     index.md
 *     hello.md
 */
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../smoke-test');
const TestBed = require('../../test-bed');

// TODO why does this case need a src/pages/index.md?
describe('Build Greenwood With: ', async function() {
  const LABEL = 'Custom Meta Configuration and Default Workspace';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, function() {
    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });
    runSmokeTest(['public', 'not-found'], LABEL);

    describe('Custom Meta Index Page', function() {
      const indexPageTitle = 'My Custom Greenwood App';
      const indexPageHeading = 'Greenwood';
      const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have our custom config meta <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal(indexPageTitle);
      });

      it('should have our custom config <meta> tag with og:site property in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="og:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('greenwood');
      });

      it('should have our custom config <meta> tag with twitter:site name in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[name="twitter:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('@PrjEvergreen');
      });

      it('should have a <script> tag in the <body>', function() {
        const scriptTag = dom.window.document.querySelectorAll('body script');

        expect(scriptTag.length).to.be.equal(1);
      });

      it('should have a router outlet tag in the <body>', function() {
        const outlet = dom.window.document.querySelectorAll('body eve-app');

        expect(outlet.length).to.be.equal(1);
      });

      it('should have the correct route tags in the <body>', function() {
        const routes = dom.window.document.querySelectorAll('body lit-route');

        expect(routes.length).to.be.equal(3);
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(indexPageBody);
      });
    });

    describe('Custom Meta Hello Page w/ Front-Matter Title Override', function() {
      const helloPageTitle = 'Hello Page';
      const helloPageHeading = 'Hello World';
      const helloPageBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './hello', './index.html'));
      });
      
      it('should output a hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './hello'))).to.be.true;
      });
      
      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './hello', './index.html'))).to.be.true;
      });

      it('should have a overridden meta <title> tag in the <head> using markdown front-matter', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal(helloPageTitle);
      });

      it('should have our custom config <meta> tag with og:site property in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[property="og:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('greenwood');
      });

      it('should have our custom config <meta> tag with og:site property in the <head>', function() {
        const metaElement = dom.window.document.querySelector('head meta[name="twitter:site"]');

        expect(metaElement.getAttribute('content')).to.be.equal('@PrjEvergreen');
      });

      it('should have the expected heading text within the hello example page in the hello directory', function() {
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(helloPageHeading);
      });

      it('should have the expected paragraph text within the hello example page in the hello directory', function() {
        let paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(helloPageBody);
      });

    });
  });
  
  after(function() {
    // setup.teardownTestBed();
  });
});