/*
 * Use Case
 * Run Greenwood build command with static setting for optimization.
 *
 * User Result
 * Should generate a Greenwood build that strips all <script> tags and files from the final HTML and output.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   optimization: 'static'
 * }
 *
 * Custom Workspace
 * src/
 *   components/
 *     header.js
 *   pages/
 *     index.html
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const TestBed = require('../../../../../test/test-bed');

describe('Build Greenwood With: ', function() {
  const LABEL = 'Static Optimization Configuration';
  let setup;

  before(async function() {
    setup = new TestBed();
    this.context = await setup.setupTestBed(__dirname);
  });

  describe(LABEL, function() {

    before(async function() {
      await setup.runGreenwoodCommand('build');
    });

    describe('JavaScript <script> tag and file static optimization', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should emit no javascript files to the output directory', async function() {
        const jsFiles = await glob.promise(path.join(this.context.publicDir, '*.js'));
        
        expect(jsFiles).to.have.lengthOf(0);
      });

      it('should contain no <link> tags in the <head>', function() {
        const linkTags = dom.window.document.querySelectorAll('head link');

        expect(linkTags.length).to.be.equal(0);
      });
      
      it('should have no <script> tags in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head script');

        expect(scriptTags.length).to.be.equal(0);
      });

      it('should contain the expected content from <app-header> in the <body>', function() {
        const header = dom.window.document.querySelectorAll('body header');

        expect(header.length).to.be.equal(1);
        expect(header[0].textContent).to.be.equal('This is the header component.');
      });
    });
  });

  after(function() {
    setup.teardownTestBed();
  });
});