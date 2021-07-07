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
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Inline Optimization Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(async function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');
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
        it('should contain two <script> tags in the <head>', function() {
          const allScriptTags = dom.window.document.querySelectorAll('head script');

          expect(allScriptTags.length).to.be.equal(2);
        });

        it('should contain no <script> tags in the <head> with a src', function() {
          const allSrcScriptTags = dom.window.document.querySelectorAll('head script[src]');

          expect(allSrcScriptTags.length).to.be.equal(0);
        });
      
        xit('should contain no Javascript files in the output directory', async function() {
          const jsFiles = await glob.promise(`${this.context.publicDir}**/**/*.js`);
          
          expect(jsFiles).to.have.lengthOf(0);
        });
      });

      // assume the first tag is for the header
      describe('Header', function() {
        it('should contain one <script> tag with the expected JS content inlined of type="module" for the header', function() {
          const scriptTag = dom.window.document.querySelectorAll('head script')[0]
          
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

      // assume the second tag is for FooBar
      // https://github.com/ProjectEvergreen/greenwood/issues/656
      describe('Foobar', function() {
        it('should contain one <script> tag with the expected JS content inlined of type="module" for the header', function() {
          const scriptTag = dom.window.document.querySelectorAll('head script')[1];

          expect(scriptTag.type).to.be.equal('module');
          // eslint-disable-next-line max-len
          expect(scriptTag.textContent).to.be.contain('class t extends HTMLElement{constructor(){super(),this.list=[]}find(t){this.list.findIndex(e=>new RegExp(`^${t}$`).test(e.route))}}export{t as Foobar};');
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
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});