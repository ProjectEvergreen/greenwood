/*
 * Use Case
 * Run Greenwood build command with no config and this plugin.
 *
 * User Result
 * Should generate a bare bones Greenwood build with correctly templated out HTML from a custom elements tag.
 *
 * User Command
 * greenwood build
 *
 * User Config
 * import { greenwoodPluginIncludeHTML } from '@greenwood/plugin-include-html';
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
 *   components/
 *     footer.js
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
  const LABEL = 'Using Custom Element feature';
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

    describe('Default custom element include and page content for index.html', function() {
      let dom;
      let footerHeadingTags;
      let headingTags;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
        footerHeadingTags = dom.window.document.querySelectorAll('body footer h4');
        headingTags = dom.window.document.querySelectorAll('body h1');
      });

      it('should have expected footer <h4> tag content in the <body>', function() {
        const text = footerHeadingTags[0].textContent;
        
        expect(footerHeadingTags.length).to.be.equal(1);
        expect(text.trim()).to.be.equal('Greenwood v1.0.0');
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