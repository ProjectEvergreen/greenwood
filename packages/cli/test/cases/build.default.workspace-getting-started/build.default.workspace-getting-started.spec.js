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
 *     blog/
 *       first-post.md
 *       second-post.md
 *     index.md
 *   styles/
 *     theme.css
 *   templates/
 *     app.html
 *     blog.html
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
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
      let dom;

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

      // TODO
      xit('should output a single 404.html file (not found page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './404.html'))).to.be.true;
      });

      it('should output two JS bundle files', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './*.js'))).to.have.lengthOf(2);
      });

      it('should have two <script> tags in the <head>', async function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(2);
      });

      it('should output one CSS file', async function() {
        expect(await glob.promise(`${path.join(this.context.publicDir, 'styles')}/theme.*.css`)).to.have.lengthOf(1);
      });

      it('should output two <style> tag in the <head> (one from puppeteer)', async function() {
        const styleTags = dom.window.document.querySelectorAll('head style');

        expect(styleTags.length).to.be.equal(2);
      });

      it('should output one <link> tag in the <head>', async function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(1);
      });

      it('should have content in the <body>', function() {
        const h2 = dom.window.document.querySelector('body h2');
        const p = dom.window.document.querySelector('body p');
        const h3 = dom.window.document.querySelector('body h3');

        expect(h2.textContent).to.be.equal('Home Page');
        expect(p.textContent).to.be.equal('This is the Getting Started home page!');
        expect(h3.textContent).to.be.equal('My Posts');
      });

      it('should have an unordered list of blog posts in the <body>', function() {
        const ul = dom.window.document.querySelectorAll('body ul');
        const li = dom.window.document.querySelectorAll('body ul li');
        const links = dom.window.document.querySelectorAll('body ul a');

        expect(ul.length).to.be.equal(1);
        expect(li.length).to.be.equal(2);
        expect(links.length).to.be.equal(2);

        expect(links[0].href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(links[0].textContent).to.be.equal('my-second-post');

        expect(links[1].href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(links[1].textContent).to.be.equal('my-first-post');
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
        expect(header[0].textContent).to.be.equal('This is the header component.');
      });

      it('should have a <footer> tag in the <body>', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
        expect(footer[0].textContent).to.be.equal('This is the footer component.');
      });
    });

    describe('First Blog Post', function() {
      let dom;
      
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog/first-post/index.html'));
      });

      it('should create a blog directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog'))).to.be.true;
      });

      it('should output an index.html file for first-post page', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'first-post', './index.html'))).to.be.true;
      });
      
      it('should have two <script> tags in the <head>', async function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(2);
      });

      it('should output one <style> tag in the <head> (one from puppeteer)', async function() {
        const styleTags = dom.window.document.querySelectorAll('head style');

        expect(styleTags.length).to.be.equal(1);
      });

      it('should output one <link> tag in the <head>', async function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(1);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
        expect(header[0].textContent).to.be.equal('This is the header component.');
      });

      it('should have an the expected content in the <body>', function() {
        const h1 = dom.window.document.querySelector('body h1');
        const h2 = dom.window.document.querySelector('body h2');
        const p = dom.window.document.querySelectorAll('body p');

        expect(h1.textContent).to.be.equal('A Blog Post Page');
        expect(h2.textContent).to.be.equal('My First Blog Post');
        
        expect(p[0].textContent).to.be.equal('Lorem Ipsum');
        expect(p[1].textContent).to.be.equal('back');
      });

      it('should have a <footer> tag in the <body>', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
        expect(footer[0].textContent).to.be.equal('This is the footer component.');
      });

      it('should have the expected content for the first blog post', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
        expect(footer[0].textContent).to.be.equal('This is the footer component.');
      });
    });

    describe('Second Blog Post', function() {
      let dom;
      
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog/second-post/index.html'));
      });

      it('should create a blog directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog'))).to.be.true;
      });

      it('should output an index.html file for first-post page', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'second-post', './index.html'))).to.be.true;
      });
      
      it('should have two <script> tags in the <head>', async function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(2);
      });

      it('should output one <style> tag in the <head> (one from puppeteer)', async function() {
        const styleTags = dom.window.document.querySelectorAll('head style');

        expect(styleTags.length).to.be.equal(1);
      });

      it('should output one <link> tag in the <head>', async function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(1);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
        expect(header[0].textContent).to.be.equal('This is the header component.');
      });

      it('should have an the expected content in the <body>', function() {
        const h1 = dom.window.document.querySelector('body h1');
        const h2 = dom.window.document.querySelector('body h2');
        const p = dom.window.document.querySelectorAll('body p');

        expect(h1.textContent).to.be.equal('A Blog Post Page');
        expect(h2.textContent).to.be.equal('My Second Blog Post');
        
        expect(p[0].textContent).to.be.equal('Lorem Ipsum');
        expect(p[1].textContent).to.be.equal('back');
      });

      it('should have a <footer> tag in the <body>', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
        expect(footer[0].textContent).to.be.equal('This is the footer component.');
      });

      it('should have the expected content for the first blog post', function() {
        const footer = dom.window.document.querySelectorAll('body footer');

        expect(footer.length).to.be.equal(1);
        expect(footer[0].textContent).to.be.equal('This is the footer component.');
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});