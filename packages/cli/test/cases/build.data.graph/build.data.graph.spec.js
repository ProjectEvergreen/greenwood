/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph.
 *
 * User Result
 * Should generate a Greenwood build that dynamically serializes data from the graph from the header and in the page-template.
 *
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *     index.md
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

describe('Build Greenwood With: ', function() {
  const LABEL = 'Data from GraphQL';
  const apolloStateRegex = /window.__APOLLO_STATE__=({.*?});/;
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'not-found'], LABEL);

    describe('Home (Page Template) w/ Navigation Query', function() {
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
      });

      it('should create a public directory', function() {
        expect(fs.existsSync(this.context.publicDir)).to.be.true;
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

      it('should output one cache.json file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './cache.json'))).to.have.lengthOf(1);
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', () => {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
        const innerHTML = apolloScriptTags[0].innerHTML;

        expect(apolloScriptTags.length).to.equal(1);
        expect(innerHTML).to.match(apolloStateRegex);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have a expected NavigationQuery output in the <header> tag', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link = listItems[0].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        expect(link.href.replace('file://', '')).to.be.equal('/blog/first-post');
        expect(link.title).to.be.equal('Click to visit the First blog post');
        expect(link.innerHTML).to.contain('First');
      });
    });

    describe('Blog Page (Template) w/ Navigation and Children Query', function() {
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', 'first-post', 'index.html'));
      });

      it('should output an index.html file (first post page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'first-post', 'index.html'))).to.be.true;
      });

      it('should output one cache.json file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'blog', 'cache.json'))).to.have.lengthOf(1);
      });

      it('should output one cache.json file to be defined', function() {
        const cacheContents = require(path.join(this.context.publicDir, 'blog', 'cache.json'));

        expect(cacheContents).to.not.be.undefined;
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', () => {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });

        expect(apolloScriptTags.length).to.be.equal(1);
        expect(apolloScriptTags[0].innerHTML).to.match(apolloStateRegex);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have expected navigation links in the <header> tag tag when using NavigationQuery', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link = listItems[0].querySelector('a');

        expect(listItems.length).to.be.equal(2);
        expect(link.href.replace('file://', '')).to.be.equal('/blog/first-post');
        expect(link.title).to.be.equal('Click to visit the First blog post');
        expect(link.innerHTML).to.contain('First');
      });

      it('should have expected blog posts links in the <body> tag when using ChildrenQuery', function() {
        const listItems = dom.window.document.querySelectorAll('body div.posts ul li');
        const linkItems = dom.window.document.querySelectorAll('body div.posts ul li a');

        expect(listItems.length).to.be.equal(2);
        expect(linkItems.length).to.be.equal(2);

        const link1 = linkItems[0];
        const link2 = linkItems[1];

        expect(link1.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link1.title).to.be.equal('Click to read my First blog post');
        expect(link1.innerHTML).to.contain('First');

        expect(link2.href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(link2.title).to.be.equal('Click to read my Second blog post');
        expect(link2.innerHTML).to.contain('Second');
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});