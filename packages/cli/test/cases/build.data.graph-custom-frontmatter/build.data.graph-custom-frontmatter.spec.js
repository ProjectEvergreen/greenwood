/*
 * Use Case
 * Run Greenwood build command with GraphQL calls to get data about the projects graph.
 *
 * User Result
 * Should generate a Greenwood build that specifically tests for custom frontmatter set by individual pages.
 * 
 * User Command
 * greenwood build
 *
 * Default Config
 *
 * Custom Workspace
 * src/
 *   pages/
 *     blog/
 *       first-post.md
 *       second-post.md
 *     index.md
 *   templates/
 *     blog-template.js
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe.only('Build Greenwood With: ', function() {
  const LABEL = 'Data from GraphQL and using Custom Frontmatter';
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

    describe('Blog Page (Template) w/ custom date', function() {
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

      it('should have expected blog posts links in the <body> tag when using ChildrenQuery', function() {
        const listItems = dom.window.document.querySelectorAll('body div.posts ul li');
        const linkItems = dom.window.document.querySelectorAll('body div.posts ul li a');

        expect(listItems.length).to.be.equal(2);
        expect(linkItems.length).to.be.equal(2);

        const link1 = linkItems[0];
        const link2 = linkItems[1];

        expect(link1.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link1.title).to.be.equal('Click to read my Blog blog post');
        expect(link1.innerHTML).to.contain('Blog posted: 2020/04/05');

        expect(link2.href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(link2.title).to.be.equal('Click to read my Blog blog post');
        expect(link2.innerHTML).to.contain('Blog posted: 2020/04/06');
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});