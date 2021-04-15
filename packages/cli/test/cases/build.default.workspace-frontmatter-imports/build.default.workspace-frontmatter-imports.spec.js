/*
 * Use Case
 * Run Greenwood build command with a workspace that uses frontmatter imports.
 *
 * User Result
 * Should generate a bare bones Greenwood build.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   components/
 *     counter/
 *       counter.js
 *       counter.css
 *   pages/
 *     examples/
 *       counter.md
 *     index.md
 */
const expect = require('chai').expect;
const fs = require('fs');
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace with Frontmatter Imports';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });
    
    runSmokeTest(['public', 'index'], LABEL);
  
    describe('Content and file output for the Counter page', function() {
      let dom;
      let html;

      before(async function() {
        const htmlPath = path.resolve(this.context.publicDir, 'examples/counter', 'index.html');

        dom = await JSDOM.fromFile(path.resolve(htmlPath));
        html = await fs.promises.readFile(htmlPath, 'utf-8');
      });

      it('should output a counter.css file from frontmatter import', async function() {
        const cssFiles = await glob.promise(`${this.context.publicDir}**/**/counter.*.css`);
          
        expect(cssFiles).to.have.lengthOf(1);
      });

      it('should output a counter.js file from frontmatter import', async function() {
        const jsFiles = await glob.promise(`${this.context.publicDir}**/**/counter.*.js`);
          
        expect(jsFiles).to.have.lengthOf(1);
      });

      it('should output a custom element tag that is _not_ wrapped in a <p> tag', function() {
        expect((/<p><x-counter>/).test(html)).to.be.false;
        expect((/<\/x-counter><\/p>/).test(html)).to.be.false;
      });

      it('should output a heading tag from the custom element', function() {
        const heading = dom.window.document.querySelectorAll('body h3');

        expect(heading.length).to.be.equal(1);
        expect(heading[0].textContent).to.be.equal('My Counter');
      });

      // JSDOM may not support this case of computing styles when using a <link> tag?
      // https://github.com/jsdom/jsdom/issues/2986
      xit('should have the color style for the output element', function() {
        const output = dom.window.document.querySelector('body ~ h2');
        const computedStyle = dom.window.getComputedStyle(output);

        expect(computedStyle.color).to.equal('red');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});