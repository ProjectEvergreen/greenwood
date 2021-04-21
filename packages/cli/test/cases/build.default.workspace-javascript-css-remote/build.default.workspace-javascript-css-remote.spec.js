/*
 * Use Case
 * Run Greenwood with various usages of JavaScript (<script>) and CSS (<style> / <link>) tags with remove links.
 * 
 * Uaer Result
 * Should generate a bare bones Greenwood build without erroring.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None
 *
 * User Workspace
 * src/
 *   pages/
 *     index.html
 *     
 */
const expect = require('chai').expect;
const glob = require('glob-promise');
const { JSDOM } = require('jsdom');
const path = require('path');
const { getSetupFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Loading remote JavaScript and CSS using <script> and <link> tags';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.join(__dirname, 'output');
  let runner;

  before(function() {
    this.context = {
      publicDir: path.join(outputPath, 'public')
    };
    runner = new Runner();
  });

  describe(LABEL, function() {
    let dom;

    before(async function() {
      await runner.setup(outputPath, getSetupFiles(outputPath));
      await runner.runCommand(cliPath, 'build');

      dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, 'index.html'));
    });

    describe('it should have the expected files in the output directory', function() {
      it('should output no javascript files', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '*.js'))).to.have.lengthOf(0);
      });

      it('should output no css files', async function() {
        expect(await glob.promise(path.join(this.context.publicDir, '*.css'))).to.have.lengthOf(0);
      });
    });

    describe('two <script></script> tags with remote URLs in the <head>', function() {
      it('should have two <script src="..."> tags in the <head>', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const mainScriptTags = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/http/).test(script.src);
        });
        
        expect(mainScriptTags.length).to.be.equal(2);
      });

      it('should have one CDN <script src="..."> tag for jquery in the <head> using http', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const jqueryScriptTag = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/http:\/\/code.jquery.com\//).test(script.src);
        });
        
        expect(jqueryScriptTag.length).to.be.equal(1);
      });

      it('should have one UNPKG <script src="..." type="module"> tag for LitElements in the <head> using https', function() {
        const scriptTags = dom.window.document.querySelectorAll('head > script');
        const unpkgScriptTag = Array.prototype.slice.call(scriptTags).filter(script => {
          return (/https:\/\/unpkg.com\//).test(script.src);
        });
        
        expect(unpkgScriptTag.length).to.be.equal(1);
      });
    });

    describe('<link rel="stylesheet" href="..."/> tag in the <head>', function() {
      it('should have one <link> tag in the <head> with no protocol specified', function() {
        const linkTags = dom.window.document.querySelectorAll('head > link');
        
        expect(linkTags.length).to.be.equal(1);
      });

      it('should have one <link> tag for google fonts in the <head> with no protocol specified', async function() {
        const linkTags = dom.window.document.querySelectorAll('head > link');
        const fontsLinkTag = Array.prototype.slice.call(linkTags).filter(link => {
          return (/\/\/fonts.googleapis.com\//).test(link.href);
        });
        
        expect(fontsLinkTag.length).to.be.equal(1);
      });
    });
  });

  after(function() {
    runner.teardown();
  });

});