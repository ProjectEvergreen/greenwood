/*
 * Use Case
 * Run Greenwood build command with default setting for optimization
 *
 * User Result
 * Should generate a Greenwood build that preloads all <script> and <link> tags
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
 *     index.html
 *   styles/
 *     theme.css
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Optimization Configuration';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
  
    describe('Default output for index.html', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      xdescribe('<script> tag and preloading', function() {
        it('should contain one javasccript file in the output directory', async function() {
          expect(await glob.promise(path.join(this.context.publicDir, '*.js'))).to.have.lengthOf(1);
        });

        it('should have the expected <script> tag in the <head>', function() {
          const scriptTags = dom.window.document.querySelectorAll('head script');

          expect(scriptTags.length).to.be.equal(1);
        });

        it('should have the expect preload <link> tag for the same <script> tag src in the <head>', function() {
          const preloadScriptTags = Array
            .from(dom.window.document.querySelectorAll('head link[rel="preload"]'))
            .filter(link => link.getAttribute('as') === 'script');

          expect(preloadScriptTags.length).to.be.equal(1);
          expect(preloadScriptTags[0].href).to.match(/header.*.js/);
          expect(preloadScriptTags[0].getAttribute('crossorigin')).to.equal('anonymous');
        });
      });

      describe('<link> tag and preloading', function() {
        it('should contain one style.css in the output directory', async function() {
          expect(await glob.promise(`${path.join(this.context.publicDir, 'styles')}/theme.*.css`)).to.have.lengthOf(1);
        });

        it('should have the expected <link> tag in the <head>', function() {
          const linkTags = Array
            .from(dom.window.document.querySelectorAll('head link[rel="preload"]'))
            .filter(tag => tag.getAttribute('as') === 'style');

          expect(linkTags.length).to.be.equal(1);
        });

        it('should have the expect preload <link> tag for the same <link> tag href in the <head>', function() {
          const preloadLinkTags = Array
            .from(dom.window.document.querySelectorAll('head link[rel="preload"]'))
            .filter(link => link.getAttribute('as') === 'style');

          expect(preloadLinkTags.length).to.be.equal(1);
          expect(preloadLinkTags[0].href).to.match(/\/styles\/theme.*.css/);
          expect(preloadLinkTags[0].getAttribute('crossorigin')).to.equal('anonymous');
        });
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});