/*
 * Use Case
 * Run Greenwood build command with inline setting for optimization
 *
 * User Result
 * Should generate a Greenwood build that inlines all JS and CSS <script> and <link> tags.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'inline'
 * }
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
  const LABEL = 'Inline Optimization Configuration';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
  
    describe('Output for JavaScript / CSS tags and files', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });
      
      it('should contain no link <tags> in the <head> tag', function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(0);
      });

      describe('<script> tag and files', function() {
        it('should contain one <script> tags in the <head>', function() {
          const allScriptTags = dom.window.document.querySelectorAll('head script');

          expect(allScriptTags.length).to.be.equal(1);
        });

        it('should contain no <script> tags in the <head> with a src', function() {
          const allSrcScriptTags = dom.window.document.querySelectorAll('head script[src]');

          expect(allSrcScriptTags.length).to.be.equal(0);
        });
      
        xit('should contain no Javascript files in the output directory', async function() {
          const jsFiles = await glob.promise(`${this.context.publicDir}**/**/*.js`);
          
          expect(jsFiles).to.have.lengthOf(0);
        });

        it('should contain one <script> tag with the expected JS content inlined of type="module"', function() {
          const scriptTag = dom.window.document.querySelectorAll('head script')[0];
          
          expect(scriptTag.type).to.be.equal('module');
          // eslint-disable-next-line max-len
          expect(scriptTag.textContent).to.be.contain('class e extends HTMLElement{constructor(){super(),this.root=this.attachShadow({mode:"open"}),this.root.innerHTML="\\n      <header>This is the header component.</header>\\n    "}}customElements.define("app-header",e);');
        });

        it('should contain the expected content from <app-header> in the <body>', function() {
          const header = dom.window.document.querySelectorAll('body header');

          expect(header.length).to.be.equal(1);
          expect(header[0].textContent).to.be.equal('This is the header component.');
        });
      });

      describe('<link> tags as <style> tags and file output', function() {
        xit('should contain no CSS files in the output directory', async function() {
          const cssFiles = await glob.promise(`${this.context.publicDir}**/**/*.css`);
          
          expect(cssFiles).to.have.lengthOf(0);
        });

        it('should contain one <style> tag with the expected CSS content inlined', function() {
          const styleTags = dom.window.document.querySelectorAll('head style');
          
          // one for puppeteer
          expect(styleTags.length).to.be.equal(2);
          expect(styleTags[1].textContent).to.be.contain('*{margin:0;padding:0;font-family:Comic Sans,sans-serif}');
        });
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});