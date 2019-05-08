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
describe('Build Greenwood With: ', () => {
  const LABEL = 'Default Greenwood Configuration and Default Workspace w/ Nested Directories';
  let setup;
  let context;

  before(async () => {
    setup = new TestBed();
    context = setup.setupTestBed(__dirname);
  });

  describe(LABEL, () => {
    before(async () => {     
      await setup.runGreenwoodCommand('build');
    });

    it('should pass smoke tests for public, not found, and index', async () => {
      await runSmokeTest(['public', 'not-found', 'index'], context, setup, LABEL);
    });

    it('should create a default blog page directory', () => {
      expect(fs.existsSync(path.join(context.publicDir, './blog'))).to.be.true;
    });

    describe('Custom blog page directory', () => {
      let dom;

      beforeEach(async() => {
        dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'blog', '2019', './index.html'));
      });

      it('should output an index.html file within the default hello page directory', () => {
        expect(fs.existsSync(path.join(context.publicDir, 'blog', '2019', './index.html'))).to.be.true;
      });

      it('should have the expected heading text within the hello example page in the hello directory', async() => {
        const heading = dom.window.document.querySelector('h3').textContent;
    
        expect(heading).to.equal('Blog Page');
      });
    
      it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
        let paragraph = dom.window.document.querySelector('p').textContent;
    
        expect(paragraph).to.equal('This is the test blog page built by Greenwood.');
      });
    });
  });

});