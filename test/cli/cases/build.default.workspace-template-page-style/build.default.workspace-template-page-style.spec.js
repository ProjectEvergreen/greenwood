/*
 * Use Case
 * Run Greenwood build command with no config and custom styled page template.
 * 
 * User Result
 * Should generate a bare bones Greenwood build with custom styled page template.
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * None (Greenwood Default)
 * 
 * User Workspace
 * src/
 *   styles/
 *     style.css
 *   templates/
 *     page-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Style Page Template';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    
    runSmokeTest(['public', 'index', 'not-found', 'hello', 'label'], LABEL);
    describe('Custom Styled Page Template', function() {

      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom styled page template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the specific style in the page template that we added as part of our custom style', async function() {

        const customElement = dom.window.document.querySelector('.owen-test');
        const computedStyle = dom.window.getComputedStyle(customElement);

        expect(computedStyle.color).to.equal('rgb(0, 0, 255)');
      });

      it('should have the specific style in the markdown that we added as part of our custom style', async function() {

        const customHeader = dom.window.document.querySelector('h3');
        const computedStyle = dom.window.getComputedStyle(customHeader);

        expect(computedStyle.color).to.equal('green');
      });
    });
    
  });
  
  after(function() {
    setup.teardownTestBed();
  });
});