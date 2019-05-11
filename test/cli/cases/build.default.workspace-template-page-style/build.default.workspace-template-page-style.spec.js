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
const TestBed = require('../../test-bed');
const RenderTest = require('../../render-test');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace w/Custom Style Page Template';
  let setup, render;

  before(async function() {
    setup = new TestBed();
    render = new RenderTest(false);
    this.context = setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    
    runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);
    describe('Custom Styled Page Template', function() {
      
      before(async function() {
        await render.runPuppeteer(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should output a single index.html file using our custom styled page template', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the specific style in the page template that we added as part of our custom style', async function() {

        const customElement = await render.getPuppeteerSelectorAndStyle('.owen-test');

        expect(customElement.color).to.equal('rgb(0, 0, 255)');
      });

      it('should have the specific style in the markdown that we added as part of our custom style', async function() {

        const header = await render.getPuppeteerSelectorAndStyle('h3');

        expect(header.color).to.equal('rgb(0, 128, 0)');
      });
    });

    after(() => {
    });
    
  });
  
  after(function() {
    render.closePuppeteer();
    setup.teardownTestBed();
  });
});