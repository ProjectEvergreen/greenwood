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
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestSetup = require('../../setup');

describe('Build Greenwood With: ', () => {
  let setup;
  let context;

  before(async () => {
    setup = new TestSetup();
    context = setup.setupWorkspace(__dirname);
  });

  describe('Default Greenwood Configuration and Default Workspace w/ Nested Directories', () => {
    before(async() => {
      await setup.runCommand('build');
    });
  
    it('should create a public directory', () => {
      expect(fs.existsSync(context.publicDir)).to.be.true;
    });

    describe('public directory output', () => {  
      it('should output a single index.html file (home page)', () => {
        expect(fs.existsSync(path.join(context.publicDir, './index.html'))).to.be.true;
      });
    
      it('should output one JS bundle file', async () => {
        expect(await glob.promise(path.join(context.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
      });

      describe('default generated index page in public directory', () => {
        const indexPageHeading = 'Greenwood';
        const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
        const hash = 'b7cc564e4c0eaf3';
        let dom;

        beforeEach(async() => {
          dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'index.html'));
        });

        it('should output an index.html file within the root public directory', () => {
          expect(fs.existsSync(path.join(context.publicDir, './index.html'))).to.be.true;
        });

        it('should have the expected heading text within the index page in the public directory', async() => {
          const heading = dom.window.document.querySelector(`h3.wc-md-${hash}`).textContent;
      
          expect(heading).to.equal(indexPageHeading);
        });

        it('should have the expected paragraph text within the index page in the public directory', async() => {
          let paragraph = dom.window.document.querySelector(`p.wc-md-${hash}`).textContent;
      
          expect(paragraph).to.equal(indexPageBody);
        });
      });

      it('should create a default blog page directory', () => {
        expect(fs.existsSync(path.join(context.publicDir, './blog'))).to.be.true;
      });

      describe('default generated blog page directory', () => {
        const blogPageHeading = 'Blog Page';
        const blogPageBody = 'This is the blog page built by Greenwood.';
        const hash = 'b76b0cb5a83b659';
        let dom;

        beforeEach(async() => {
          dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'blog', '2019', './index.html'));
        });

        it('should output an index.html file within the default hello page directory', () => {
          expect(fs.existsSync(path.join(context.publicDir, 'blog', '2019', './index.html'))).to.be.true;
        });

        it('should have the expected heading text within the hello example page in the hello directory', async() => {
          const heading = dom.window.document.querySelector(`h3.wc-md-${hash}`).textContent;
      
          expect(heading).to.equal(blogPageHeading);
        });
      
        it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
          let paragraph = dom.window.document.querySelector(`p.wc-md-${hash}`).textContent;
      
          expect(paragraph).to.equal(blogPageBody);
        });
      });
    });
  });

  after(() => {
    setup.teardownWorkspace();
  });

});