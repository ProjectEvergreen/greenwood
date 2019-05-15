/*
 * Use Case
 * Run Greenwood with default config and nested directories in workspace.
 * 
 * Result
 * Test for correctly nested generated output.
 * 
 * Command
 * greenwood build
 * 
 * User Config
 * None (Greenwood default)
 * 
 * User Workspace
 * src/
 *   pages/
 *     blog/
 *       2019/
 *         index.md
 */
const expect = require('chai').expect;
const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../test-bed');

// TODO why does this case need a src/pages/index.md?
describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Default Workspace w/ Nested Directories';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {   
      await setup.runGreenwoodCommand('build');
    });
    
    runSmokeTest(['public', 'not-found', 'index', 'meta'], LABEL);

    it('should create a default blog page directory', function() {
      expect(fs.existsSync(path.join(this.context.publicDir, './blog'))).to.be.true;
    });

    describe('Custom blog page directory', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', '2019', './index.html'));
      });

      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', '2019', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the hello example page in the hello directory', async function() {
        const heading = dom.window.document.querySelector('h3').textContent;
    
        expect(heading).to.equal('Blog Page');
      });
    
      it('should have the expected paragraph text within the hello example page in the hello directory', async function() {
        let paragraph = dom.window.document.querySelector('p').textContent;
    
        expect(paragraph).to.equal('This is the test blog page built by Greenwood.');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});