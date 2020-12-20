/*
 * Use Case
 * Run Greenwood with custom markdown preset in greenwood config.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom markdown and rehype links
 *
 * User Command
 * greenwood build
 *
 * User Config
 * Default
 *
 * User Workspace
 * Greenwood default
 */
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Markdown';
  let setup;

  before(async function() {
    setup = new TestBed();

    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    // TODO runSmokeTest(['public', 'index'], LABEL);
    runSmokeTest(['public', 'index'], LABEL);

    describe('Markdown Rendering', function() {
      let dom;
    
      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });
    
      it('should correctly rendering an <h3> tag', function() {
        const heading = dom.window.document.querySelectorAll('body h3');
        
        expect(heading.length).to.equal(1);
        expect(heading[0].textContent).to.equal('Greenwood Markdown Test');
      });
    
      it('should correctly render a <p> tag', function() {
        const paragraph = dom.window.document.querySelectorAll('body p');
      
        expect(paragraph.length).to.equal(1);
        expect(paragraph[0].textContent).to.be.equal('This is some markdown being rendered by Greenwood.');
      });

      it('should correctly render markdown with a <code> tag', function() {
        const code = dom.window.document.querySelectorAll('body pre code');
        
        expect(code.length).to.equal(1);
        expect(code[0].textContent).to.contain('console.log(\'hello world\');');
      });

      it('should correctly render markdown with an HTML <img> tag in it', function() {
        const images = dom.window.document.querySelectorAll('body img');
        const myImage = images[0];
        
        expect(images.length).to.equal(1);
        expect(myImage.src).to.contain('my-image.png');
        expect(myImage.alt).to.equal('just passing by');
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});