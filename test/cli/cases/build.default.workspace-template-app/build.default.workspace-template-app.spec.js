/*
 * Use Case
 * Run Greenwood build command with no config and custom app template.
 * 
 * User Result
 * Should generate a bare bones Greenwood build with custom app template.
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * None (Greenwood Default)
 * 
 * User Workspace
 * src/
 *   templates/
 *     app-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', () => {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom App Template';
  let setup;
  let context;

  before(async () => {
    setup = new TestBed();
    context = setup.setupTestBed(__dirname);
  });

  describe(LABEL, () => {
    let dom;

    before(async () => {     
      await setup.runGreenwoodCommand('build');
    });

    it('should pass all public, not-found, and hello smoke tests', async () => {
      await runSmokeTest(['public', 'not-found', 'hello'], context, setup, LABEL);
    });

    describe('Custom Index (Home) page', () => {
      const indexPageHeading = 'Greenwood';
      const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
      let dom;

      beforeEach(async() => {
        dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'index.html'));
      });

      it('should have a <title> tag in the <head>', () => {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal('My App');
      });

      it('should have a <script> tag in the <body>', () => {
        const scriptTag = dom.window.document.querySelectorAll('body script');

        expect(scriptTag.length).to.be.equal(1);
      });

      it('should have a router outlet tag in the <body>', () => {
        const outlet = dom.window.document.querySelectorAll('body eve-app');

        expect(outlet.length).to.be.equal(1);
      });

      // no 404 route in our custom app-template.js, like greenwood does
      it('should have the correct route tags in the <body>', () => {
        const routes = dom.window.document.querySelectorAll('body lit-route');

        expect(routes.length).to.be.equal(2);
      });

      it('should have the expected heading text within the index page in the public directory', () => {
        const heading = dom.window.document.querySelector('h3').textContent;
    
        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', () => {
        let paragraph = dom.window.document.querySelector('p').textContent;
    
        expect(paragraph).to.equal(indexPageBody);
      });
    });

    describe('Custom App Template', () => {
      before(async() => {
        dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom app template', () => {
        expect(fs.existsSync(path.join(context.publicDir, './index.html'))).to.be.true;
      });
  
      it('should have the specific element we added as part of our custom app template', () => {
        const customParagraph = dom.window.document.querySelector('p#custom-app-template').textContent;
        
        expect(customParagraph).to.equal('My Custom App Template');
      });
    });
  });
  
});