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
 * import { greenwoodPluginIncludeHTML } from '@greenwod/plugin-include-html';
 *
 * {
 *   plugins: [{
 *     greenwoodPluginIncludeHTML()
 *  }]
 *
 * }
 *
 * User Workspace
 * src/
 *   includes/
 *     header.html
 *   pages/
 *     index.html
 */
import chai from 'chai';
import { JSDOM } from 'jsdom';
import path from 'path';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { fileURLToPath, URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With HTML Include Plugin: ', function() {
  const LABEL = 'Default Greenwood Configuration and Workspace';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = fileURLToPath(new URL('.', import.meta.url));
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
    
    runSmokeTest(['public', 'index'], LABEL);

    describe('Default <link> include and page content for index.html', function() {
      let dom;
      let pTags;
      let headingTags;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
        pTags = dom.window.document.querySelectorAll('body header p');
        headingTags = dom.window.document.querySelectorAll('body h1');
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