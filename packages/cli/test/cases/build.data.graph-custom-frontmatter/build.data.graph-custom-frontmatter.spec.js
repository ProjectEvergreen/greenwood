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

const mainBundleScriptRegex = /index.*.bundle\.js/;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Data from GraphQL and using Custom Frontmatter Data';
  const apolloStateRegex = /window.__APOLLO_STATE__ = true/;
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

      it('should output a (partial) *-cache.json file, one per each query made', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, './*-cache.json'))).to.have.lengthOf(3);
      });

      it('should output a (partial) *-cache.json files, one per each query made, that are all defined', async function() {
        const cacheFiles = await glob.promise(path.join(this.context.publicDir, './*-cache.json'));

        cacheFiles.forEach(file => {
          const cache = require(file);

          expect(cache).to.not.be.undefined;
        });
      });

      it('should have one <script> tag in the <body> for the main bundle', function() {
        const scriptTags = dom.window.document.querySelectorAll('body > script');
        const bundledScript = Array.prototype.slice.call(scriptTags).filter(script => {
          const src = script.src.replace('file:///', '');

          return mainBundleScriptRegex.test(src);
        });

        expect(bundledScript.length).to.be.equal(1);
      });

      it('should have one window.__APOLLO_STATE__ <script> with (approximated) expected state', () => {
        const scriptTags = dom.window.document.querySelectorAll('script');
        const apolloScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return script.getAttribute('data-state') === 'apollo';
        });
        const innerHTML = apolloScriptTags[0].innerHTML;

        expect(apolloScriptTags.length).to.equal(1);
        expect(innerHTML).to.match(apolloStateRegex);
      });

      // two webpack bundles, and apollo state
      it('should have only 3 <script> tag in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');

        expect(scriptTags.length).to.be.equal(3);
      });

      it('should have expected blog posts links in the <body> tag when using ChildrenQuery', function() {
        const listItems = dom.window.document.querySelectorAll('body div.posts ul li');
        const linkItems = dom.window.document.querySelectorAll('body div.posts ul li a');
        const spanItems = dom.window.document.querySelectorAll('body div.posts ul li span');

        expect(listItems.length).to.be.equal(2);
        expect(linkItems.length).to.be.equal(2);
        expect(spanItems.length).to.be.equal(2);

        const link1 = linkItems[0];
        const link2 = linkItems[1];
        const span1 = spanItems[0];
        const span2 = spanItems[1];

        expect(link1.href.replace('file://', '')).to.be.equal('/blog/first-post/');
        expect(link1.title).to.be.equal('Click to read my Blog blog post');
        expect(link1.innerHTML).to.contain('Blog posted: 2020/04/05');
        expect(span1.innerHTML).to.contain('Author: Lorum');

        expect(link2.href.replace('file://', '')).to.be.equal('/blog/second-post/');
        expect(link2.title).to.be.equal('Click to read my Blog blog post');
        expect(link2.innerHTML).to.contain('Blog posted: 2020/04/06');
        expect(span2.innerHTML).to.contain('Author: Ipsum');
      });
    });

  });

  after(function() {
    setup.teardownTestBed();
  });

});