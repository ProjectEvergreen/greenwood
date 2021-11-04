/*
 * Use Case
 * Run Greenwood build command with no config and this plugin.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly templated out HTML from the <link> tag.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * None (Greenwood Default)
 *
 * User Workspace
 * src/
 *   includes/
 *     header.html
 *   pages/
 *     index.html
 */
const expect = require('chai').expect;
const { JSDOM } = require('jsdom');
const path = require('path');
const runSmokeTest = require('../../../../../test/smoke-test');
const { getSetupFiles, getOutputTeardownFiles } = require('../../../../../test/utils');
const Runner = require('gallinago').Runner;

describe('Build Greenwood With HTML Include Plugin: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = __dirname;
  let runner;

  before(function() {
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
    
    runSmokeTest(['public'], LABEL);

    describe('Default <link> include and page content for index.html', function() {
      let dom;
      let styleTags;
      let pTags;
      let headingTags;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
        styleTags = dom.window.document.querySelectorAll('body style');
        pTags = dom.window.document.querySelectorAll('body header p');
        headingTags = dom.window.document.querySelectorAll('body h1');
      });

      it('should have an inline <style> with include content in the <body>', function() {
        const styles = styleTags[0].textContent;
        
        expect(styleTags.length).to.be.equal(1);
        expect(styles.replace(/\n/g, '').replace(/ /g, '').trim()).to.be.equal('p.include{text-align:center;}');
      });

      it('should have expected <p> tag content in the <body>', function() {
        const text = pTags[0].textContent;
        
        expect(pTags.length).to.be.equal(1);
        expect(text.trim()).to.be.equal('This is the website header.');
      });

      it('should have existing <h1> content in the <body>', function() {
        const text = headingTags[0].textContent;
        
        expect(headingTags.length).to.be.equal(1);
        expect(text).to.be.equal('Hello!');
      });
    });

  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});