/*
 * Use Case
 * Run Greenwood build command with no config and test for default generated output.
 * 
 * Command
 * greenwood build
 * 
 * Config
 * N / A (Greenwood default)
 * 
 * Workspace
 * N / A (Greenwood default)
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestSetup = require('../../setup');

describe('Build Command With: ', () => {
  let setup;
  let context;

  before(async () => {
    setup = new TestSetup();
    context = setup.setupWorkspace();
  });

  describe('Default Greenwood Configuration', () => {
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
        let dom;

        beforeEach(async() => {
          dom = await JSDOM.fromFile(path.resolve(context.publicDir, 'index.html'));
        });

        it('should output an index.html file within the root public directory', () => {
          expect(fs.existsSync(path.join(context.publicDir, './index.html'))).to.be.true;
        });

        it('should have the expected heading text within the index page in the public directory', async() => {
          const heading = dom.window.document.querySelector('h3.wc-md-index').textContent;
      
          expect(heading).to.equal(indexPageHeading);
        });

        it('should have the expected paragraph text within the index page in the public directory', async() => {
          let paragraph = dom.window.document.querySelector('p.wc-md-index').textContent;
      
          expect(paragraph).to.equal(indexPageBody);
        });
      });

      it('should create a default hello page directory', () => {
        expect(fs.existsSync(path.join(context.publicDir, './hello'))).to.be.true;
      });

      describe('default generated hello page directory', () => {
        const helloPageHeading = 'Hello World';
        const helloPageBody = 'This is an example page built by Greenwood.  Make your own in src/pages!';
        let dom;

        beforeEach(async() => {
          dom = await JSDOM.fromFile(path.resolve(context.publicDir, './hello', './index.html'));
        });

        it('should output an index.html file within the default hello page directory', () => {
          expect(fs.existsSync(path.join(context.publicDir, './hello', './index.html'))).to.be.true;
        });

        it('should have the expected heading text within the hello example page in the hello directory', async() => {
          const heading = dom.window.document.querySelector('h3.wc-md-hello').textContent;
      
          expect(heading).to.equal(helloPageHeading);
        });
      
        it('should have the expected paragraph text within the hello example page in the hello directory', async() => {
          let paragraph = dom.window.document.querySelector('p.wc-md-hello').textContent;
      
          expect(paragraph).to.equal(helloPageBody);
        });
      });
    });
  });

  after(() => {
    setup.teardownWorkspace();
  });

});