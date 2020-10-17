/*
 * Use Case
 * Run Greenwood build command and reproduce building the Getting Started docs companion repo
 * https://github.com/ProjectEvergreen/greenwood-getting-started
 *
 * User Result
 * Should generate a Greenwood build that generally reproduces the Getting Started guide
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   assets/
 *     greenwood-logo.png
 *   components/
 *     footer.js
 *     header.js
 *   pages/
 *     first-post.md
 *     second-post.md
 *   styles/
 *     theme.css
 *   templates/
 *     app-template.js
 *     blog-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

xdescribe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Workspace based on the Getting Started guide and repo';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('Folder Structure and Home Page', function() {
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should create a public directory', function() {
        expect(fs.existsSync(this.context.publicDir)).to.be.true;
      });

      it('should create a new assets directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'assets'))).to.be.true;
      });

      it('should contain files from the asset directory', async function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'assets', './greenwood-logo.png'))).to.be.true;
      });

      it('should output an index.html file (home page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should output a single 404.html file (not found page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './404.html'))).to.be.true;
      });

      it('should output one JS bundle file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have a <footer> tag in the <body>', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
      });

      it('should have the expected font import', function() {
        const styles = '@import url(//fonts.googleapis.com/css?family=Source+Sans+Pro&display=swap);';
        const styleTags = dom.window.document.querySelectorAll('head style');
        let importCount = 0;

        styleTags.forEach((tag) => {
          if (tag.textContent.indexOf(styles) >= 0) {
            importCount += 1;
          }
        });

        expect(importCount).to.equal(1);
      });
    });

    describe('Blog Posts', function() {
      it('should create a blog directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog'))).to.be.true;
      });

      it('should output an index.html file (home page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'first-post', './index.html'))).to.be.true;
      });

      it('should output a single 404.html file (not found page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'second-post', './index.html'))).to.be.true;
      });

      it('should output one JS bundle file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './index.*.bundle.js'))).to.have.lengthOf(1);
      });

      it('should have a <header> tag in the <body> in first-post.md', async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', 'first-post', 'index.html'));
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have a <footer> tag in the <body>', async function() {
        const dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', 'first-post', 'index.html'));
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
      });

      it('should have the expected font import', function() {
        const styles = '@import url(//fonts.googleapis.com/css?family=Source+Sans+Pro&display=swap);';
        const styleTags = dom.window.document.querySelectorAll('head style');
        let importCount = 0;

        styleTags.forEach((tag) => {
          if (tag.textContent.indexOf(styles) >= 0) {
            importCount += 1;
          }
        });

        expect(importCount).to.equal(1);
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});