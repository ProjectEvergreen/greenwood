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
      const expectedCache = {"ROOT_QUERY.navigation.0":{"label":"Blog","link":"/blog/","__typename":"Navigation"},"ROOT_QUERY":{"navigation":[{"type":"id","generated":true,"id":"ROOT_QUERY.navigation.0","typename":"Navigation"}]}};  // eslint-disable-line

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

      // TODO fixing the ordering issue would help make this test case more reliable - #271
      xit('should output one cache.json file with expected cache contents', async function() {
        const cacheContents = require(path.join(this.context.publicDir, './cache.json'));

        expect(cacheContents).to.be.deep.equalInAnyOrder(expectedCache);
      });

      it('should have one window.__APOLLO_STATE__ <script> tag set in index.html', () => {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });

        expect(apolloScriptTags.length).to.be.equal(1);
        expect(apolloScriptTags[0].innerHTML).to.contain(`window.__APOLLO_STATE__=${JSON.stringify(expectedCache)}`);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have a expected NavigationQuery output in the <header> tag', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link = listItems[0].querySelector('a');

        expect(listItems.length).to.be.equal(1);
        expect(link.href.replace('file://', '')).to.be.equal('/blog/');
        expect(link.title).to.be.equal('Click to visit the Blog page');
        expect(link.innerHTML).to.contain('Blog');
      });
    });

    describe('Blog Page (Template) w/ Navigation and Children Query', function() {
      const expectedCache = {"ROOT_QUERY.children({\"parent\":\"blog\"}).0":{"title":"Blog","link":"/blog/first-post","__typename":"Page"},"ROOT_QUERY.children({\"parent\":\"blog\"}).1":{"title":"Blog","link":"/blog/second-post","__typename":"Page"},"ROOT_QUERY":{"children({\"parent\":\"blog\"})":[{"type":"id","generated":true,"id":"ROOT_QUERY.children({\"parent\":\"blog\"}).0","typename":"Page"},{"type":"id","generated":true,"id":"ROOT_QUERY.children({\"parent\":\"blog\"}).1","typename":"Page"}],"navigation":[{"type":"id","generated":true,"id":"ROOT_QUERY.navigation.0","typename":"Navigation"}]},"ROOT_QUERY.navigation.0":{"label":"Blog","link":"/blog/","__typename":"Navigation"}}; // eslint-disable-line
      
      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'blog', 'first-post', 'index.html'));
      });

      it('should output an index.html file (first post page)', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'blog', 'first-post', 'index.html'))).to.be.true;
      });

      it('should output one cache.json file', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, 'blog', 'cache.json'))).to.have.lengthOf(1);
      });

      // TODO fixing the ordering issue would help make this test case more reliable - #271
      xit('should output one cache.json file with expected cache contents', function() {
        const cacheContents = require(path.join(this.context.publicDir, 'blog', 'cache.json'));

        expect(cacheContents).to.be.deep.equalInAnyOrder(expectedCache);
      });

      it('should have one window.__APOLLO_STATE__ <script> tag set in index.html', () => {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });

        expect(apolloScriptTags.length).to.be.equal(1);
        // TODO fixing the ordering issue would help make this test case more reliable - #271
        // expect(apolloScriptTags[0].innerHTML).to.contain(`window.__APOLLO_STATE__=${JSON.stringify(expectedCache)}`);
      });

      it('should have a <header> tag in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
      });

      it('should have a expected NavigationQuery output in the <header> tag', function() {
        const listItems = dom.window.document.querySelectorAll('body header ul li');
        const link = listItems[0].querySelector('a');

        expect(listItems.length).to.be.equal(1);
        expect(link.href.replace('file://', '')).to.be.equal('/blog/');
        expect(link.title).to.be.equal('Click to visit the Blog page');
        expect(link.innerHTML).to.contain('Blog');
      });

      it('should have expected ChildrenQuery output in the <body> tag', function() {
        const listItems = dom.window.document.querySelectorAll('body div.posts ul li');
        const linkItems = dom.window.document.querySelectorAll('body div.posts ul li a');

        expect(listItems.length).to.be.equal(2);
        expect(linkItems.length).to.be.equal(2);

        // TODO fixing the ordering issue would remove need to rely on ordering for testing - #371
        // e.g. these should be .equal, not .contain
        const link1 = linkItems[0];

        expect(link1.href.replace('file://', '')).to.be.contain('/blog/');
        expect(link1.title).to.be.contain('Click to read my');
        expect(link1.innerHTML).to.contain('Blog');

        const link2 = linkItems[1];

        expect(link2.href.replace('file://', '')).to.be.contain('/blog/');
        expect(link2.title).to.be.contain('Click to read my');
        expect(link2.innerHTML).to.contain('Blog');
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});