/*
 * Use Case
 * Run Greenwood with meta in Greenwood config and a default workspace with a nested route.
 *
 * User Result
 * Should generate a bare bones Greenwood build with one nested About page w/ custom meta data.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   title: 'My Custom Greenwood App',
 *   meta: [
 *     { property: 'og:site', content: 'The Greenhouse I/O' },
 *     { property: 'og:url', content: 'https://www.thegreenhouse.io' },
 *     { name: 'twitter:site', content: '@thegreenhouseio' }
 *     { rel: 'shortcut icon', href: '/assets/images/favicon.ico' }
 *     { rel: 'icon', href: '/assets/images/favicon.ico' }
 *   ]
 * }
 *
 * User Workspace
 * Greenwood default w/ nested page
 *  src/
 *   pages/
 *     about/
 *       index.md
 *     hello.md
 *     index.md
 */
const fs = require('fs');
const greenwoodConfig = require('./greenwood.config');
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Custom Meta Configuration and Nested Workspace';
  const meta = greenwoodConfig.meta;
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {
    const metaFilter = (metaKey) => {
      return meta.filter((item) => {
        if (item.property === metaKey || item.name === metaKey || item.rel === metaKey) {
          return item;
        }
      })[0];
    };

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    runSmokeTest(['public', 'not-found', 'hello'], LABEL);

    // hardcoding index smoke test here because of the nested route
    describe('Index (home) page with custom meta data', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have a <title> tag in the <head>', function() {
        const title = dom.window.document.querySelector('head title').textContent;

        expect(title).to.be.equal('My Custom Greenwood App');
      });

      it('should have one <script> tag in the <body>', function() {
        const scriptTag = dom.window.document.querySelectorAll('body script');

        expect(scriptTag.length).to.be.equal(1);
      });

      it('should have a router outlet tag in the <body>', function() {
        const outlet = dom.window.document.querySelectorAll('body eve-app');

        expect(outlet.length).to.be.equal(1);
      });

      it('should have the correct route tags in the <body>', function() {
        const routes = dom.window.document.querySelectorAll('body lit-route');

        expect(routes.length).to.be.equal(4);
      });

      it('should have the expected heading text within the index page in the public directory', function() {
        const indexPageHeading = 'Greenwood';
        const heading = dom.window.document.querySelector('h3').textContent;

        expect(heading).to.equal(indexPageHeading);
      });

      it('should have the expected paragraph text within the index page in the public directory', function() {
        const indexPageBody = 'This is the home page built by Greenwood. Make your own pages in src/pages/index.js!';
        const paragraph = dom.window.document.querySelector('p').textContent;

        expect(paragraph).to.equal(indexPageBody);
      });

      it('should have a <meta> tag with custom og:site content in the <head>', function() {
        const ogSiteMeta = metaFilter('og:site');
        const metaElement = dom.window.document.querySelector(`head meta[property="${ogSiteMeta.property}`);

        expect(metaElement.getAttribute('content')).to.be.equal(ogSiteMeta.content);
      });

      it('should have a <meta> tag with custom og:url content in the <head>', function() {
        const ogUrlMeta = metaFilter('og:url');
        const metaElement = dom.window.document.querySelector(`head meta[property="${ogUrlMeta.property}"]`);

        expect(metaElement.getAttribute('content')).to.be.equal(`${ogUrlMeta.content}/`);
      });

      it('should have a <meta> tag with custom twitter:site content in the <head>', function() {
        const twitterSiteMeta = metaFilter('twitter:site');
        const metaElement = dom.window.document.querySelector(`head meta[name="${twitterSiteMeta.name}"]`);

        expect(metaElement.getAttribute('content')).to.be.equal(twitterSiteMeta.content);
      });
    });

    describe('Nested About page meta data', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'about', './index.html'));
      });

      it('should output an index.html file within the about page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, 'about', './index.html'))).to.be.true;
      });

      it('should have a <meta> tag with custom og:site content in the <head>', function() {
        const ogSiteMeta = metaFilter('og:site');
        const metaElement = dom.window.document.querySelector(`head meta[property="${ogSiteMeta.property}`);

        expect(metaElement.getAttribute('content')).to.be.equal(ogSiteMeta.content);
      });

      it('should have custom config <meta> tag with og:url property in the <head>', function() {
        const ogUrlMeta = metaFilter('og:url');
        const metaElement = dom.window.document.querySelector(`head meta[property="${ogUrlMeta.property}"]`);

        expect(metaElement.getAttribute('content')).to.be.equal(`${ogUrlMeta.content}/about/`);
      });

      it('should have our custom config <meta> tag with twitter:site name in the <head>', function() {
        const twitterSiteMeta = metaFilter('twitter:site');
        const metaElement = dom.window.document.querySelector(`head meta[name="${twitterSiteMeta.name}"]`);

        expect(metaElement.getAttribute('content')).to.be.equal(twitterSiteMeta.content);
      });
    });

    describe('favicon', function() {
      let dom;

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should have our custom config <link> tag with shortcut icon in the <head>', function() {
        const shortcutIconLink = metaFilter('shortcut icon');
        const linkElement = dom.window.document.querySelector(`head link[rel="${shortcutIconLink.rel}"]`);

        expect(linkElement.getAttribute('href')).to.be.equal(shortcutIconLink.href);
      });

      it('should have our custom config <link> tag with icon in the <head>', function() {
        const iconLink = metaFilter('icon');
        const linkElement = dom.window.document.querySelector(`head link[rel="${iconLink.rel}"]`);

        expect(linkElement.getAttribute('href')).to.be.equal(iconLink.href);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});