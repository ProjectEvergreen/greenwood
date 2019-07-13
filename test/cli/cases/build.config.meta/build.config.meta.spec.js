/*
 * Use Case
 * Run Greenwood with meta config object and default workspace.
 * 
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with meta data
 * 
 * User Command
 * greenwood build
 * 
 * User Config
 * {
 *   title: 'My Custom Greenwood App',
 *   meta: [
 *     { property: 'og:site', content: 'greenwood' },
 *     { name: 'og:url', content: 'https://www.greenwoodjs.io' }
 *     { name: 'twitter:site', content: '@PrjEvergreen' }
 *   ]
 * }
 * 
 * User Workspace
 * Greenwood default 
 *  src/
 *   pages/
 *     index.md
 *     hello.md
 */
const fs = require('fs');
const greenwoodConfig = require('./greenwood.config');
const { JSDOM } = require('jsdom');
const path = require('path');
const expect = require('chai').expect;
const runSmokeTest = require('../../smoke-test');
const TestBed = require('../../test-bed');

describe('Build Greenwood With: ', async function() {
  const LABEL = 'Custom Meta Configuration and Default Workspace';
  const meta = greenwoodConfig.meta;
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = setup.setupTestBed(__dirname);
  });
  
  describe(LABEL, function() {
    before(async function() {     
      await setup.runGreenwoodCommand('build');
    });
    runSmokeTest(['public', 'index', 'not-found', 'hello'], LABEL);

    describe('Custom Meta Index Page', function() {
      let dom;

      const metaFilter = (metaKey) => {
        return meta.filter((item) => {
          if (item.property === metaKey || item.name === metaKey) {
            return item;
          }
        })[0];
      };

      beforeEach(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should output an index.html file within the default hello page directory', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have our custom config <meta> tag with og:site property in the <head>', function() {
        const ogSiteMeta = metaFilter('og:site');
        const metaElement = dom.window.document.querySelector(`head meta[property="${ogSiteMeta.property}`);

        expect(metaElement.getAttribute('content')).to.be.equal(ogSiteMeta.content);
      });

      it('should have our custom config <meta> tag with og:url property in the <head>', function() {
        const ogUrlMeta = metaFilter('og:url');
        const metaElement = dom.window.document.querySelector(`head meta[property="${ogUrlMeta.property}"]`);

        expect(metaElement.getAttribute('content')).to.be.equal(ogUrlMeta.content);
      });

      it('should have our custom config <meta> tag with twitter:site name in the <head>', function() {
        const twitterSiteMeta = metaFilter('twitter:site');
        const metaElement = dom.window.document.querySelector(`head meta[name="${twitterSiteMeta.name}"]`);

        expect(metaElement.getAttribute('content')).to.be.equal(twitterSiteMeta.content);
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });

});