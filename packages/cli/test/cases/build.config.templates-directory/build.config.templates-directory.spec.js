/*
 * Use Case
 * Run Greenwood with a custom name for templates directory.
 *
 * User Result
 * Should generate a bare bones Greenwood build.  (same as build.default.spec.js) with custom title in header
 *
 * User Command
 * greenwood build
 *
 * User Config
 * {
 *   templatesDirectory: 'layouts'
 * }
 *
 * User Workspace
 * Greenwood default
 *  src/
 *   pages/
 *     index.md
 *   layouts/
 *     page.html
 */
import fs from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import chai from 'chai';
import { runSmokeTest } from '../../../../../test/smoke-test.js';
import { getSetupFiles, getOutputTeardownFiles } from '../../../../../test/utils.js';
import { Runner } from 'gallinago';
import { URL } from 'url';

const expect = chai.expect;

describe('Build Greenwood With: ', function() {
  const LABEL = 'Custom Pages Directory from Configuration';
  const cliPath = path.join(process.cwd(), 'packages/cli/src/index.js');
  const outputPath = path.dirname(new URL('', import.meta.url).pathname);
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

    describe('Page Content', function() {
      let dom;

      before(async function() {
        dom = await JSDOM.fromFile(path.resolve(this.context.publicDir, './index.html'));
      });

      it('should output an index.html file for the home page', function() {
        expect(fs.existsSync(path.join(this.context.publicDir, './index.html'))).to.be.true;
      });

      it('should have the correct page heading', function() {
        const heading = dom.window.document.querySelectorAll('head title')[0].textContent;

        expect(heading).to.be.equal('Custom Layout Page Template');
      });

      it('should have the correct page heading', function() {
        const heading = dom.window.document.querySelectorAll('body h1')[0].textContent;

        expect(heading).to.be.equal('Home Page');
      });

      it('should have the correct page heading', function() {
        const paragraph = dom.window.document.querySelectorAll('body p')[0].textContent;

        expect(paragraph).to.be.equal('A page using a page template from a custom layout directory.');
      });
    });
  });

  after(function() {
    runner.teardown(getOutputTeardownFiles(outputPath));
  });
});